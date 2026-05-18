import { getCurrentUserRole } from "@/lib/roles";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

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
      <div className="max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-brand/10 pb-6">
          <div className="flex flex-col w-full sm:w-auto">
            {/* Elegant, space-saving Back Action specifically optimized for mobile views */}
            <Link
              href="/"
              className="group sm:hidden inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand bg-brand/5 dark:bg-brand/10 hover:bg-brand/15 border border-brand/15 dark:border-brand/25 px-4 py-2.5 rounded-full transition-all duration-300 w-fit mb-4 shadow-[0_2px_8px_rgba(221,24,59,0.04)] hover:shadow-[0_4px_12px_rgba(221,24,59,0.1)] active:scale-95 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-0.5 shrink-0" />
              <span>Torna alla Home</span>
            </Link>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-brand">
              Admin Dashboard
            </h1>
            <p className="mt-1.5 text-sm sm:text-lg text-muted-foreground">
              Gestione servizi, prodotti e utenti.
            </p>
          </div>
          
          {/* Elegant pill button specifically optimized for desktop and tablet views */}
          <Button 
            variant="outline" 
            asChild 
            className="hidden sm:inline-flex shrink-0 rounded-full border-brand/20 dark:border-brand/30 bg-background/50 hover:bg-brand hover:text-white hover:border-brand transition-all duration-300 font-bold px-5 h-11 shadow-sm hover:shadow-brand/25 group"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              Torna alla Home
            </Link>
          </Button>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
