import Link from "next/link";

export default function PortalInvalidLink() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="font-serif text-3xl font-light">Link inválido</h1>
        <p className="text-grey/60">
          Este link do portal expirou ou não existe. Contacte a equipa HAXR
          Signature.
        </p>
        <Link
          href="/"
          className="inline-block text-admin-gold hover:underline text-sm font-mono uppercase tracking-wider"
        >
          Voltar ao site
        </Link>
      </div>
    </main>
  );
}
