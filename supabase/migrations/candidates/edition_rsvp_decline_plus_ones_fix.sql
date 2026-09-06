-- CANDIDATE MIGRATION — NOT AUTO-APPLIED
--
-- Purpose: keep the persisted guest row consistent with the Edition RSVP RPC
-- response when an existing guest changes from attending to declined.
--
-- Root cause (026_edition_gifts_rsvp_extras.sql):
--   v_plus_ones is correctly set to 0 when p_attending=false, but the UPDATE
--   preserved guests.plus_ones from the previous RSVP. The JSON response already
--   returned plusOnes=0, leaving response and persisted state inconsistent.
--
-- Scope: replace ONLY the 11-argument public.submit_edition_rsvp body.
-- No table/schema/grant/role changes. CREATE OR REPLACE preserves function ACL.
-- Production apply requires a separate explicit GO.

BEGIN;

CREATE OR REPLACE FUNCTION public.submit_edition_rsvp(
  p_event_id uuid,
  p_name text,
  p_name_normalized text,
  p_attending boolean,
  p_party_size integer DEFAULT 1,
  p_edition_slug text DEFAULT ''::text,
  p_email text DEFAULT ''::text,
  p_phone text DEFAULT ''::text,
  p_message_for_bride text DEFAULT ''::text,
  p_size text DEFAULT ''::text,
  p_dress_code_confirmed boolean DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_guest guests%ROWTYPE;
  v_name TEXT;
  v_normalized TEXT;
  v_status guest_status;
  v_plus_ones INT;
  v_notes TEXT;
  v_created BOOLEAN := false;
  v_guest_id UUID;
  v_message TEXT;
  v_size TEXT;
BEGIN
  v_name := trim(coalesce(p_name, ''));
  v_normalized := trim(coalesce(p_name_normalized, ''));
  v_message := left(trim(coalesce(p_message_for_bride, '')), 280);
  v_size := left(trim(coalesce(p_size, '')), 12);

  IF length(v_name) < 2 THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_name');
  END IF;

  IF v_normalized = '' THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_name_normalized');
  END IF;

  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'event_not_found');
  END IF;

  IF p_attending THEN
    IF p_party_size IS NULL OR p_party_size < 1 OR p_party_size > 10 THEN
      RETURN json_build_object('ok', false, 'error', 'invalid_party_size');
    END IF;
    v_status := 'confirmed';
    v_plus_ones := greatest(0, p_party_size - 1);
  ELSE
    v_status := 'declined';
    v_plus_ones := 0;
  END IF;

  v_notes := trim(
    coalesce(nullif(p_edition_slug, ''), 'edition') ||
    ' · convite digital · ' ||
    to_char(now() AT TIME ZONE 'Africa/Maputo', 'YYYY-MM-DD HH24:MI')
  );

  IF v_message <> '' THEN
    v_notes := v_notes || E'\nMensagem: ' || v_message;
  END IF;

  IF v_size <> '' THEN
    v_notes := v_notes || E'\nTamanho: ' || v_size;
  END IF;

  IF p_dress_code_confirmed IS NOT NULL THEN
    v_notes := v_notes || E'\nDress code: ' ||
      CASE WHEN p_dress_code_confirmed THEN 'confirmado (uma peça rosa)' ELSE 'não confirmado' END;
  END IF;

  SELECT * INTO v_guest
  FROM guests
  WHERE event_id = p_event_id
    AND guest_source = 'edition_rsvp'
    AND name_normalized = v_normalized
  LIMIT 1;

  IF FOUND THEN
    UPDATE guests
    SET
      name = v_name,
      email = coalesce(nullif(trim(p_email), ''), email),
      phone = coalesce(nullif(trim(p_phone), ''), phone),
      status = v_status,
      plus_ones = v_plus_ones,
      guest_notes = v_notes,
      updated_at = now()
    WHERE id = v_guest.id
    RETURNING id INTO v_guest_id;
  ELSE
    INSERT INTO guests (
      event_id,
      name,
      name_normalized,
      email,
      phone,
      qr_token,
      status,
      plus_ones,
      guest_notes,
      guest_source
    )
    VALUES (
      p_event_id,
      v_name,
      v_normalized,
      coalesce(trim(p_email), ''),
      coalesce(trim(p_phone), ''),
      generate_guest_qr_token(),
      v_status,
      v_plus_ones,
      v_notes,
      'edition_rsvp'
    )
    RETURNING id INTO v_guest_id;

    v_created := true;
  END IF;

  INSERT INTO guest_audit_log (guest_id, event_id, guest_name, action, details)
  VALUES (
    v_guest_id,
    p_event_id,
    v_name,
    CASE WHEN v_created THEN 'RSVP Edition · novo convidado' ELSE 'RSVP Edition · actualizado' END,
    CASE
      WHEN p_attending THEN
        'Confirmado via edition (' || coalesce(nullif(p_edition_slug, ''), 'convite') || ') · ' ||
        p_party_size::text || ' pessoa(s)' ||
        CASE WHEN v_message <> '' THEN ' · mensagem' ELSE '' END ||
        CASE WHEN v_size <> '' THEN ' · tamanho ' || v_size ELSE '' END
      ELSE
        'Declinou via edition (' || coalesce(nullif(p_edition_slug, ''), 'convite') || ')'
    END
  );

  RETURN json_build_object(
    'ok', true,
    'guestId', v_guest_id,
    'status', v_status,
    'created', v_created,
    'partySize', CASE WHEN p_attending THEN p_party_size ELSE 0 END,
    'plusOnes', v_plus_ones
  );
END;
$$;

COMMIT;

-- Verification after manual Preview apply:
-- 1. create attending party_size=3  -> guests.plus_ones=2
-- 2. update attending party_size=2  -> guests.plus_ones=1
-- 3. decline                         -> guests.plus_ones=0
-- 4. RPC decline response            -> plusOnes=0
-- 5. verify function owner/ACL unchanged
