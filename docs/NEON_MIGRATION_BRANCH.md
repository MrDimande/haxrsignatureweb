# Neon Migration Branch

Esta branch (`migration/supabase-to-neon`) foi criada exclusivamente para preparar e validar a migração do backend Supabase para Neon sem alterar o ambiente de produção.

Princípios desta branch:
- `main` continua a servir Production com Supabase durante a migração.
- Esta branch deve gerar Vercel Preview.
- O Preview será ligado ao ambiente Neon de migração.
- Nenhuma alteração deve chegar a Production sem validação funcional e técnica.
