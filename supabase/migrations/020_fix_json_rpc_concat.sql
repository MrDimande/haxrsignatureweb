-- Corrige concatenação JSON nas RPCs (|| só funciona com jsonb, não json)
-- Se o check-in ainda falhar, execute também: supabase/snippets/fix-checkin-only.sql

CREATE OR REPLACE FUNCTION perform_event_checkin(
  p_event_id UUID,
  p_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest guests%ROWTYPE;
  v_lookup JSON;
BEGIN
  v_lookup := lookup_event_checkin(p_event_id, p_token);
  IF (v_lookup->>'ok')::boolean IS NOT TRUE THEN
    RETURN v_lookup;
  END IF;

  SELECT * INTO v_guest
  FROM guests
  WHERE event_id = p_event_id AND qr_token = p_token;

  IF v_guest.status = 'checked_in' THEN
    RETURN (v_lookup::jsonb || jsonb_build_object('alreadyCheckedIn', true))::json;
  END IF;

  UPDATE guests SET status = 'checked_in', updated_at = now()
  WHERE id = v_guest.id;

  INSERT INTO checkins (guest_id, event_id)
  VALUES (v_guest.id, p_event_id)
  ON CONFLICT (guest_id) DO NOTHING;

  v_lookup := lookup_event_checkin(p_event_id, p_token);
  RETURN (v_lookup::jsonb || jsonb_build_object('checkedIn', true))::json;
END;
$$;

CREATE OR REPLACE FUNCTION perform_event_rsvp(
  p_event_id UUID,
  p_token TEXT,
  p_attendance TEXT DEFAULT 'confirm',
  p_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_plus_ones INT DEFAULT NULL,
  p_dietary_notes TEXT DEFAULT NULL,
  p_guest_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest guests%ROWTYPE;
  v_lookup JSON;
  v_attendance TEXT;
  v_plus INT;
BEGIN
  v_attendance := lower(trim(coalesce(p_attendance, 'confirm')));
  IF v_attendance NOT IN ('confirm', 'decline') THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_attendance');
  END IF;

  v_lookup := lookup_event_checkin(p_event_id, p_token);
  IF (v_lookup->>'ok')::boolean IS NOT TRUE THEN
    RETURN v_lookup;
  END IF;

  SELECT * INTO v_guest
  FROM guests
  WHERE event_id = p_event_id AND qr_token = p_token;

  IF v_guest.status = 'checked_in' THEN
    RETURN (v_lookup::jsonb || jsonb_build_object('alreadyCheckedIn', true))::json;
  END IF;

  IF v_attendance = 'confirm' AND v_guest.status = 'confirmed' THEN
    RETURN (v_lookup::jsonb || jsonb_build_object('alreadyConfirmed', true))::json;
  END IF;

  IF v_attendance = 'decline' AND v_guest.status = 'declined' THEN
    RETURN (v_lookup::jsonb || jsonb_build_object('alreadyDeclined', true))::json;
  END IF;

  v_plus := coalesce(p_plus_ones, v_guest.plus_ones);
  IF v_plus < 0 THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_plus_ones');
  END IF;

  UPDATE guests
  SET
    name = coalesce(NULLIF(trim(p_name), ''), name),
    email = coalesce(NULLIF(trim(p_email), ''), email),
    phone = coalesce(NULLIF(trim(p_phone), ''), phone),
    plus_ones = CASE WHEN v_attendance = 'confirm' THEN v_plus ELSE plus_ones END,
    dietary_notes = CASE
      WHEN v_attendance = 'confirm' THEN coalesce(p_dietary_notes, dietary_notes)
      ELSE dietary_notes
    END,
    guest_notes = coalesce(NULLIF(trim(p_guest_notes), ''), guest_notes),
    status = CASE
      WHEN v_attendance = 'decline' THEN 'declined'::guest_status
      ELSE 'confirmed'::guest_status
    END,
    updated_at = now()
  WHERE id = v_guest.id;

  v_lookup := lookup_event_checkin(p_event_id, p_token);

  IF v_attendance = 'decline' THEN
    RETURN (v_lookup::jsonb || jsonb_build_object('declinedRsvp', true))::json;
  END IF;

  RETURN (v_lookup::jsonb || jsonb_build_object('confirmedRsvp', true))::json;
END;
$$;

REVOKE ALL ON FUNCTION perform_event_checkin(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION perform_event_checkin(UUID, TEXT) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION perform_event_rsvp(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION perform_event_rsvp(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT) TO anon, authenticated, service_role;
