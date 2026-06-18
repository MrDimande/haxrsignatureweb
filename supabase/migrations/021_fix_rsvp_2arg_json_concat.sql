-- Corrige overload antigo (migration 010) com assinatura de 2 parâmetros

CREATE OR REPLACE FUNCTION perform_event_rsvp(
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

  IF v_guest.status = 'confirmed' THEN
    RETURN (v_lookup::jsonb || jsonb_build_object('alreadyConfirmed', true))::json;
  END IF;

  UPDATE guests
  SET status = 'confirmed', updated_at = now()
  WHERE id = v_guest.id;

  v_lookup := lookup_event_checkin(p_event_id, p_token);
  RETURN (v_lookup::jsonb || jsonb_build_object('confirmedRsvp', true))::json;
END;
$$;

REVOKE ALL ON FUNCTION perform_event_rsvp(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION perform_event_rsvp(UUID, TEXT) TO anon, authenticated, service_role;
