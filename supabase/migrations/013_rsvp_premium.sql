-- RSVP Premium: declined status, campos completos e lookup enriquecido
-- Idempotente — seguro para reexecutar

DO $$ BEGIN
  ALTER TYPE guest_status ADD VALUE IF NOT EXISTS 'declined';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION lookup_event_checkin(
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
  v_event events%ROWTYPE;
  v_seat seats%ROWTYPE;
  v_table TEXT;
  v_seat_label TEXT;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  SELECT * INTO v_guest
  FROM guests
  WHERE event_id = p_event_id AND qr_token = p_token;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'not_found');
  END IF;

  SELECT * INTO v_event FROM events WHERE id = p_event_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'event_not_found');
  END IF;

  IF v_guest.seat_id IS NOT NULL THEN
    SELECT * INTO v_seat FROM seats WHERE id = v_guest.seat_id;
    v_table := v_seat.table_name;
    v_seat_label := COALESCE(NULLIF(trim(v_seat.label), ''), v_seat.seat_number::TEXT);
  END IF;

  RETURN json_build_object(
    'ok', true,
    'guest', json_build_object(
      'name', v_guest.name,
      'email', v_guest.email,
      'phone', v_guest.phone,
      'status', v_guest.status,
      'plusOnes', v_guest.plus_ones,
      'dietaryNotes', v_guest.dietary_notes,
      'guestNotes', v_guest.guest_notes
    ),
    'event', json_build_object(
      'name', v_event.name,
      'type', v_event.type,
      'date', v_event.date,
      'location', v_event.location
    ),
    'seat', CASE WHEN v_guest.seat_id IS NOT NULL THEN
      json_build_object(
        'tableName', v_table,
        'seatNumber', v_seat.seat_number,
        'label', v_seat_label
      )
    ELSE NULL END
  );
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
    RETURN v_lookup || json_build_object('alreadyCheckedIn', true);
  END IF;

  IF v_attendance = 'confirm' AND v_guest.status = 'confirmed' THEN
    RETURN v_lookup || json_build_object('alreadyConfirmed', true);
  END IF;

  IF v_attendance = 'decline' AND v_guest.status = 'declined' THEN
    RETURN v_lookup || json_build_object('alreadyDeclined', true);
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
    RETURN v_lookup || json_build_object('declinedRsvp', true);
  END IF;

  RETURN v_lookup || json_build_object('confirmedRsvp', true);
END;
$$;

REVOKE ALL ON FUNCTION perform_event_rsvp(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION perform_event_rsvp(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT) TO anon, authenticated, service_role;
