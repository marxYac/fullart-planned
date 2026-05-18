import { getCurrentUserRole } from "@/lib/roles";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getCurrentUserRole();

  if (!["super_user", "admin", "operator"].includes(role)) {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-brand">Admin Dashboard</h1>
            <p className="mt-2 text-lg text-muted">Gestione servizi, prodotti e utenti.</p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Torna alla Home
            </Link>
          </Button>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
