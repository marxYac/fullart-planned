import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Accesso Negato</h1>
      <p className="text-muted-foreground mb-8">Non hai i permessi necessari per visualizzare questa pagina.</p>
      <Link href="/" className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition">
        Torna alla Home
      </Link>
    </div>
  );
}
