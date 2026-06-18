-- Campo explícito «o que pretende» no formulário de contacto

ALTER TABLE contact_inquiries
  ADD COLUMN IF NOT EXISTS intent TEXT;

UPDATE contact_inquiries
SET intent = message
WHERE intent IS NULL AND message IS NOT NULL AND trim(message) <> '';
