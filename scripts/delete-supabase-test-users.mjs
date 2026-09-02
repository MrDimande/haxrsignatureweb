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
  console.log("Credenciais de service role não encontradas");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const targetEmails = ["aldimande@outlook.com", "aludimande@gmail.com"];

const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
if (listError) {
  console.error("Erro ao listar utilizadores:", listError.message);
  process.exit(1);
}

for (const email of targetEmails) {
  console.log(`\n========================================`);
  console.log(`🧹 A limpar todos os dados de: ${email}`);
  console.log(`========================================`);
  
  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.log(`Utilizador ${email} já não existe no Supabase.`);
    continue;
  }

  const userId = user.id;
  console.log(`User ID: ${userId}`);

  // 1. Get all client_events owned by this user
  const { data: events, error: evErr } = await supabase
    .from("client_events")
    .select("id")
    .eq("owner_user_id", userId);

  const eventIds = events?.map((e) => e.id) ?? [];
  console.log(`Eventos pertencentes ao utilizador: ${eventIds.length}`);

  // 2. Clear profiles active_client_event_id
  await supabase
    .from("profiles")
    .update({ active_client_event_id: null })
    .eq("id", userId);

  if (eventIds.length > 0) {
    await supabase
      .from("profiles")
      .update({ active_client_event_id: null })
      .in("active_client_event_id", eventIds);

    // 3. Delete event onboarding snapshots
    await supabase
      .from("event_onboarding_snapshots")
      .delete()
      .in("client_event_id", eventIds);

    // 4. Delete event members
    await supabase
      .from("event_members")
      .delete()
      .in("client_event_id", eventIds);

    // 5. Delete supplier shortlists
    await supabase
      .from("supplier_shortlists")
      .delete()
      .in("client_event_id", eventIds);
  }

  // 6. Delete event members where user is member
  await supabase
    .from("event_members")
    .delete()
    .eq("user_id", userId);

  // 7. Delete event onboarding snapshots where user is owner
  await supabase
    .from("event_onboarding_snapshots")
    .delete()
    .eq("owner_user_id", userId);

  // 8. Delete supplier applications
  await supabase
    .from("supplier_applications")
    .delete()
    .eq("applicant_user_id", userId);

  // 9. Delete supplier profiles
  await supabase
    .from("supplier_profiles")
    .delete()
    .eq("owner_user_id", userId);

  // 10. Delete client_events owned by user
  if (eventIds.length > 0) {
    const { error: evDelErr } = await supabase
      .from("client_events")
      .delete()
      .in("id", eventIds);

    if (evDelErr) {
      console.warn("Aviso ao apagar client_events:", evDelErr.message);
    } else {
      console.log(`  - Apagados ${eventIds.length} eventos em client_events`);
    }
  }

  // 11. Delete profile
  const { error: profErr } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profErr) {
    console.warn("Aviso ao apagar profile:", profErr.message);
  } else {
    console.log("  - Apagado profile do utilizador");
  }

  // 12. Finally delete user from auth.users
  const { error: delUserErr } = await supabase.auth.admin.deleteUser(userId);
  if (delUserErr) {
    console.error(`❌ Erro final ao apagar utilizador de auth.users: ${delUserErr.message}`);
  } else {
    console.log(`🎉 SUCESSO: Utilizador ${email} (${userId}) foi totalmente removido!`);
  }
}
