-- RSVP aberto dos convites Edition (edition.haxrsignature.com)
-- Persiste confirmações no admin HAXR sem token pré-existente

DO $$ BEGIN
  ALTER TYPE guest_source ADD VALUE IF NOT EXISTS 'edition_rsvp';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION generate_guest_qr_token()
RETURNS TEXT
LANGUAGE sql
VOLATILE
SET search_path = public, extensions
AS $$
  SELECT rtrim(
    translate(encode(gen_random_bytes(24), 'base64'), '+/', '-_'),
    '='
  );
$$;

CREATE OR REPLACE FUNCTION submit_edition_rsvp(
  p_event_id UUID,
  p_name TEXT,
  p_name_normalized TEXT,
  p_attending BOOLEAN,
  p_party_size INT DEFAULT 1,
  p_edition_slug TEXT DEFAULT '',
  p_email TEXT DEFAULT '',
  p_phone TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
BEGIN
  v_name := trim(coalesce(p_name, ''));
  v_normalized := trim(coalesce(p_name_normalized, ''));

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
      plus_ones = CASE WHEN p_attending THEN v_plus_ones ELSE plus_ones END,
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
        p_party_size::text || ' pessoa(s)'
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

REVOKE ALL ON FUNCTION submit_edition_rsvp(UUID, TEXT, TEXT, BOOLEAN, INT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_edition_rsvp(UUID, TEXT, TEXT, BOOLEAN, INT, TEXT, TEXT, TEXT) TO service_role;
