import Link from "next/link";

type EventsMigrationNoticeProps = {
  migrationFile: string;
};

export default function EventsMigrationNotice({
  migrationFile,
}: EventsMigrationNoticeProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="admin-card max-w-xl p-8 space-y-6">
        <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Base de dados
        </p>
        <h1 className="font-serif text-2xl font-light text-white">
          Módulo de eventos não activado
        </h1>
        <p className="text-sm text-grey/70 leading-relaxed">
          As tabelas de eventos ainda não existem no Supabase. É necessário
          executar a migration SQL antes de usar Find Your Seat.
        </p>
        <ol className="text-sm text-grey/80 space-y-2 list-decimal list-inside">
          <li>
            Abrir{" "}
            <a
              href="https://supabase.com/dashboard/project/oxsrdmydlqyvnueedgtl/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-admin-gold hover:underline"
            >
              Supabase → SQL Editor
            </a>
          </li>
          <li>
            Colar e executar o ficheiro{" "}
            <code className="text-white/80 bg-black-soft px-1.5 py-0.5 rounded text-xs">
              supabase/migrations/{migrationFile}
            </code>
          </li>
          <li>Recarregar esta página</li>
        </ol>
        <p className="text-xs text-grey/50 font-mono">
          Cria: events, seats, guests, checkins + RLS
        </p>
        <Link href="/admin/dashboard" className="admin-btn-secondary inline-flex">
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  );
}
