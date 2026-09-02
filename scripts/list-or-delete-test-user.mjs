import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.development.local");
loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.log("Supabase service role credentials not found in env files.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const targetEmail = process.argv[2];

const { data, error } = await supabase.auth.admin.listUsers();
if (error) {
  console.error("Erro ao listar utilizadores:", error.message);
  process.exit(1);
}

console.log(`Total de utilizadores encontrados: ${data.users.length}`);
for (const u of data.users) {
  console.log(`- ID: ${u.id} | Email: ${u.email} | Criado: ${u.created_at}`);
}

if (targetEmail) {
  const userToDelete = data.users.find(
    (u) => u.email?.toLowerCase() === targetEmail.toLowerCase(),
  );
  if (!userToDelete) {
    console.log(`\nNenhum utilizador encontrado com o email: ${targetEmail}`);
  } else {
    const { error: delError } = await supabase.auth.admin.deleteUser(userToDelete.id);
    if (delError) {
      console.error(`Erro ao apagar utilizador ${targetEmail}:`, delError.message);
    } else {
      console.log(`\n✅ Utilizador ${targetEmail} (${userToDelete.id}) apagado com sucesso do Supabase!`);
    }
  }
}
