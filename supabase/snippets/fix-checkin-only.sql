-- Aplicar APENAS isto no SQL Editor se o check-in ainda falhar após a 020.
-- Corrige: operator does not exist: json || json

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

REVOKE ALL ON FUNCTION perform_event_checkin(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION perform_event_checkin(UUID, TEXT) TO anon, authenticated, service_role;
