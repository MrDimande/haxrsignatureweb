-- Edition: presentes, campos RSVP farewell, lembretes automáticos

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS edition_registry_key text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.events.edition_registry_key IS
  'Chave do catálogo Edition (ex.: rose-elegance) para presentes e export.';

UPDATE public.events
SET edition_registry_key = 'rose-elegance'
WHERE id = 'de9e7136-987d-487a-a1c7-62988239e503'
  AND edition_registry_key = '';

CREATE TABLE IF NOT EXISTS public.edition_gift_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_key text NOT NULL,
  gift_id text NOT NULL,
  gift_name text NOT NULL DEFAULT '',
  reserved_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT edition_gift_reservations_registry_gift_unique UNIQUE (registry_key, gift_id)
);

CREATE INDEX IF NOT EXISTS edition_gift_reservations_registry_key_idx
  ON public.edition_gift_reservations (registry_key);

ALTER TABLE public.edition_gift_reservations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.edition_gift_reservations
  ADD COLUMN IF NOT EXISTS gift_name text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.edition_rsvp_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  reminder_key text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT edition_rsvp_reminder_log_unique UNIQUE (event_id, guest_id, reminder_key)
);

CREATE INDEX IF NOT EXISTS edition_rsvp_reminder_log_event_id_idx
  ON public.edition_rsvp_reminder_log (event_id);

ALTER TABLE public.edition_rsvp_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.reserve_edition_gift(
  p_registry_key text,
  p_gift_id text,
  p_reserved_by text,
  p_gift_name text DEFAULT ''::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reserved_by text;
  v_existing record;
  v_gift_name text;
BEGIN
  v_reserved_by := trim(coalesce(p_reserved_by, ''));
  v_gift_name := left(trim(coalesce(p_gift_name, '')), 200);

  IF coalesce(trim(p_registry_key), '') = '' OR coalesce(trim(p_gift_id), '') = '' THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_input');
  END IF;

  IF length(v_reserved_by) < 2 THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_reserved_by');
  END IF;

  SELECT reserved_by, created_at
  INTO v_existing
  FROM edition_gift_reservations
  WHERE registry_key = trim(p_registry_key)
    AND gift_id = trim(p_gift_id)
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'already_reserved',
      'reservedBy', v_existing.reserved_by,
      'timestamp', v_existing.created_at
    );
  END IF;

  INSERT INTO edition_gift_reservations (registry_key, gift_id, reserved_by, gift_name)
  VALUES (trim(p_registry_key), trim(p_gift_id), v_reserved_by, v_gift_name);

  RETURN json_build_object('ok', true);
EXCEPTION
  WHEN unique_violation THEN
    SELECT reserved_by, created_at
    INTO v_existing
    FROM edition_gift_reservations
    WHERE registry_key = trim(p_registry_key)
      AND gift_id = trim(p_gift_id)
    LIMIT 1;

    RETURN json_build_object(
      'ok', false,
      'error', 'already_reserved',
      'reservedBy', coalesce(v_existing.reserved_by, 'outra convidada'),
      'timestamp', v_existing.created_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_edition_gift(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_edition_gift(text, text, text, text) TO service_role;

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

REVOKE ALL ON FUNCTION public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text, text, text, boolean) TO service_role;
