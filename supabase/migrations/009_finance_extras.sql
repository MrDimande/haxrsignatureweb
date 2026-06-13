-- Despesas operacionais e metas mensais da caixa
-- Idempotente: seguro para reexecutar após falha parcial

DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM (
    'production',
    'suppliers',
    'marketing',
    'logistics',
    'payroll',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS finance_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  category expense_category NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency currency_code NOT NULL DEFAULT 'MZN',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance_monthly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount >= 0),
  currency currency_code NOT NULL DEFAULT 'MZN',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, year, month, currency)
);

CREATE INDEX IF NOT EXISTS idx_finance_expenses_business ON finance_expenses (business_id);
CREATE INDEX IF NOT EXISTS idx_finance_expenses_event ON finance_expenses (event_id);
CREATE INDEX IF NOT EXISTS idx_finance_expenses_date ON finance_expenses (expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_targets_period ON finance_monthly_targets (business_id, year, month);

DROP TRIGGER IF EXISTS finance_expenses_updated_at ON finance_expenses;
CREATE TRIGGER finance_expenses_updated_at
  BEFORE UPDATE ON finance_expenses
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS finance_monthly_targets_updated_at ON finance_monthly_targets;
CREATE TRIGGER finance_monthly_targets_updated_at
  BEFORE UPDATE ON finance_monthly_targets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
