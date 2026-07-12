export default function ConciergeMigrationNotice() {
  return (
    <div className="rounded border border-amber-500/40 bg-amber-500/10 p-6 text-stone-200">
      <h3 className="font-serif text-lg mb-2">Migration Concierge em falta</h3>
      <p className="text-sm text-stone-400 mb-3">
        Execute a migration{" "}
        <code className="text-amber-200">027_concierge.sql</code> no Supabase
        para activar o HAXR Concierge (upload, IA e revisão).
      </p>
      <p className="text-xs text-stone-500">
        Supabase Dashboard → SQL → colar o ficheiro em{" "}
        <code>supabase/migrations/027_concierge.sql</code>
      </p>
    </div>
  );
}
