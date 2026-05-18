"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SignInButton, useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Phone, 
  Camera, 
  LayoutDashboard,
  Sparkles
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { getUserAppointments } from "@/lib/actions/booking";
import { toast } from "sonner";

export default function AppointmentsPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;
  const canAccessDashboard = role === "admin" || role === "super_user" || role === "operator";
  
  const [dbAppointments, setDbAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      if (!isSignedIn) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const appointmentsRes = await getUserAppointments();
        if (appointmentsRes.success) {
          setDbAppointments(appointmentsRes.data ?? []);
        } else {
          toast.error(appointmentsRes.error || "Errore nel caricamento delle prenotazioni");
        }
      } catch (error) {
        toast.error("Si è verificato un errore imprevisto");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (isLoaded) {
      loadAppointments();
    }
  }, [isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand selection:text-white overflow-x-hidden">
      {/* Background Subtle Elements */}
      <div className="fixed inset-0 pointer-events-none bg-noise" />
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-brand/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] bg-brand/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Top Nav */}
      <nav aria-label="Navigazione principale" className="site-nav">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-effect site-nav-inner soft-shadow">
          <Link href="/" className="site-brand text-brand">FULLART</Link>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <Link href="/wellness" className="hover:text-brand transition-colors">Wellness</Link>
            <Link href="/products" className="hover:text-brand transition-colors">Products</Link>
            <Link href="/appointments" className="hover:text-brand transition-colors font-bold text-brand">I miei appuntamenti</Link>
            {canAccessDashboard && (
              <Link href="/admin" className="hover:text-brand transition-colors font-bold text-brand">Dashboard</Link>
            )}
          </div>

          <div className="nav-actions">
            <ModeToggle />
            {isLoaded && !isSignedIn && (
              <SignInButton mode="redirect">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex hover:bg-brand/10 hover:text-brand transition-all font-semibold h-9"
                >
                  ACCEDI
                </Button>
              </SignInButton>
            )}
            {isLoaded && isSignedIn && (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 md:w-9 md:h-9 border border-brand/20",
                  },
                }}
              />
            )}

            {isLoaded && isSignedIn && canAccessDashboard && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-brand hover:bg-brand/10 rounded-xl"
                  aria-label="Accedi alla Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5" />
                </Button>
              </Link>
            )}

            <Link href="/book-appointment">
              <Button size="sm" className="bg-brand hover:bg-brand-hover text-white rounded-xl px-4 sm:px-6 transition-all h-9 sm:h-10 text-xs sm:text-sm font-bold">
                PRENOTA
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content" className="page-hero pt-24 pb-20">
        <div className="site-shell max-w-3xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
              <Sparkles className="w-3 h-3" />
              I tuoi appuntamenti
            </div>
            <h1 className="hero-title md:text-6xl font-bold tracking-tighter mb-4">
              Gestisci i tuoi <span className="text-brand italic font-serif">rituali</span>.
            </h1>
            <p className="text-muted max-w-md mx-auto text-sm sm:text-base">
              Visualizza lo storico e gestisci le tue prenotazioni future in un unico posto esclusivo.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!isLoaded || isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-effect p-8 rounded-[2.5rem] border border-brand/5 animate-pulse h-28" />
                ))}
              </motion.div>
            ) : !isSignedIn ? (
              <motion.div
                key="unauthenticated"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-effect p-12 rounded-[3rem] text-center soft-shadow border border-brand/10"
              >
                <div className="size-20 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="size-10" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Accesso richiesto</h3>
                <p className="text-muted mb-8 max-w-sm mx-auto">Accedi per visualizzare e gestire le tue prenotazioni passate e future.</p>
                <SignInButton mode="redirect">
                  <Button className="bg-brand hover:bg-brand-hover text-white rounded-2xl h-14 px-12 font-bold shadow-lg shadow-brand/20">
                    ACCEDI ORA
                  </Button>
                </SignInButton>
              </motion.div>
            ) : (
              <motion.div
                key="appointments-list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid gap-6"
              >
                {dbAppointments.map((apt) => (
                  <div key={apt.id} className="glass-effect p-8 rounded-[2.5rem] soft-shadow border border-transparent hover:border-brand/10 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <CheckCircle2 className="size-20 text-brand" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="size-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center font-black text-xl flex-col shrink-0">
                          <span className="text-[10px] uppercase opacity-50 font-sans tracking-wider font-bold">
                            {new Date(apt.appointmentDate).toLocaleString('it-IT', { month: 'short' })}
                          </span>
                          <span className="-mt-1 font-serif italic text-2xl font-black">
                            {new Date(apt.appointmentDate).getDate()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold mb-1 tracking-tight">{apt.service?.name}</h3>
                          <p className="text-muted font-medium flex flex-wrap items-center gap-x-2 gap-y-1 text-xs uppercase tracking-widest">
                            <span className="flex items-center gap-1"><User className="size-3.5" /> {apt.operator?.name}</span>
                            <span className="opacity-30">•</span>
                            <span className="flex items-center gap-1"><Clock className="size-3.5" /> {new Date(apt.appointmentDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="opacity-30">•</span>
                            <span className="text-brand font-bold font-sans tracking-tight">{(apt.service?.price / 100).toFixed(0)}€</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-4 border-t border-brand/5 md:border-0 pt-4 md:pt-0">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${apt.status === "confirmed" ? "bg-emerald-500/10 text-emerald-500" : apt.status === "pending" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"}`}>
                          {apt.status === "confirmed" ? "Confermato" : apt.status === "pending" ? "In Attesa" : apt.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {dbAppointments.length === 0 && (
                  <div className="glass-effect p-16 rounded-[3rem] text-center soft-shadow border border-brand/10">
                    <p className="text-muted italic">Non hai ancora prenotazioni attive.</p>
                    <Link href="/book-appointment">
                      <Button 
                        variant="link" 
                        className="text-brand font-bold mt-4 inline-flex items-center gap-1 cursor-pointer"
                      >
                        Prenota il tuo primo rituale <ArrowRight className="w-4 h-4 animate-pulse" />
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Helper Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-20 pt-12 border-t border-brand/10 text-center"
          >
            <h2 className="text-2xl font-bold mb-4 italic font-serif text-brand">Hai bisogno di assistenza?</h2>
            <p className="text-muted max-w-lg mx-auto mb-8 font-medium">
              Se desideri modificare o disdire un appuntamento confermato, contattaci direttamente telefonicamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:+390000000000" className="inline-flex items-center justify-center gap-2 bg-brand/10 text-brand hover:bg-brand hover:text-white px-6 py-3 rounded-xl font-bold transition-all">
                <Phone className="w-4 h-4" /> Chiama Ora
              </a>
              <a href="#" className="inline-flex items-center justify-center gap-2 bg-muted/10 hover:bg-muted/20 px-6 py-3 rounded-xl font-bold transition-all">
                <Camera className="w-4 h-4" /> Instagram
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-14 md:py-20 border-t border-brand/10">
        <div className="site-shell grid md:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-20">
          <div className="col-span-2">
            <span className="text-3xl font-bold text-brand mb-6 block">FULLART</span>
            <p className="text-muted max-w-sm text-lg">
              L&apos;eccellenza nel design dei capelli e nella cura del benessere maschile. Via della Bellezza 12, Milano.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-brand">Link Rapidi</h4>
            <ul className="space-y-4 text-muted">
              <li><Link href="/" className="hover:text-brand transition-colors">Home</Link></li>
              <li><Link href="/wellness" className="hover:text-brand transition-colors">Wellness</Link></li>
              <li><Link href="/products" className="hover:text-brand transition-colors">Products</Link></li>
              <li><Link href="/book-appointment" className="hover:text-brand transition-colors">Prenotazioni</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-brand">Seguici</h4>
            <ul className="space-y-4 text-muted">
              <li><a href="#" className="hover:text-brand transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">TikTok</a></li>
            </ul>
          </div>
        </div>
        <div className="site-shell flex flex-col md:flex-row justify-between items-center text-sm text-muted font-medium text-center md:text-left">
          <p>© {new Date().getFullYear()} FULLART HAIR DESIGNER AND CARE. TUTTI I DIRITTI RISERVATI.</p>
          <div className="mobile-footer-links flex gap-8 mt-4 md:mt-0">
            <a href="#" className="hover:text-brand transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand transition-colors">Termini di Servizio</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
