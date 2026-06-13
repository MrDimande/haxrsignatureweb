-- HAXR Signature — Event Seating & Guest Management
-- Run after 005_contact_inquiries.sql

DO $$ BEGIN
  CREATE TYPE guest_status AS ENUM ('invited', 'confirmed', 'checked_in');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Events ─────────────────────────────────────────────────────────────────

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type event_type NOT NULL DEFAULT 'other',
  date DATE,
  location TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_business ON events (business_id, date DESC);
CREATE INDEX idx_events_date ON events (date DESC NULLS LAST);

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Seats ────────────────────────────────────────────────────────────────────

CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  seat_number INTEGER NOT NULL DEFAULT 1,
  label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, table_name, seat_number)
);

CREATE INDEX idx_seats_event ON seats (event_id, table_name, seat_number);

-- ─── Guests ───────────────────────────────────────────────────────────────────

CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  client_type client_type NOT NULL DEFAULT 'individual',
  seat_id UUID REFERENCES seats(id) ON DELETE SET NULL,
  qr_token TEXT NOT NULL UNIQUE,
  status guest_status NOT NULL DEFAULT 'invited',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT guests_seat_unique UNIQUE (seat_id)
);

CREATE INDEX idx_guests_event ON guests (event_id, name);
CREATE INDEX idx_guests_qr_token ON guests (qr_token);
CREATE INDEX idx_guests_status ON guests (event_id, status);

CREATE TRIGGER guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Check-ins ────────────────────────────────────────────────────────────────

CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL UNIQUE REFERENCES guests(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  checkin_time TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkins_event ON checkins (event_id, checkin_time DESC);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS. Direct anon/authenticated access denied (no policies).

-- ─── Public check-in RPC (token-only, no sensitive leakage) ─────────────────

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
      'status', v_guest.status
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
    RETURN v_lookup || json_build_object('alreadyCheckedIn', true);
  END IF;

  UPDATE guests SET status = 'checked_in', updated_at = now()
  WHERE id = v_guest.id;

  INSERT INTO checkins (guest_id, event_id)
  VALUES (v_guest.id, p_event_id)
  ON CONFLICT (guest_id) DO NOTHING;

  v_lookup := lookup_event_checkin(p_event_id, p_token);
  RETURN v_lookup || json_build_object('checkedIn', true);
END;
$$;

REVOKE ALL ON FUNCTION lookup_event_checkin(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION perform_event_checkin(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lookup_event_checkin(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION perform_event_checkin(UUID, TEXT) TO anon, authenticated, service_role;
