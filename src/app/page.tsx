"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SignInButton, useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Leaf, ShieldCheck, Sparkles, LayoutDashboard } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const { user, isSignedIn, isLoaded } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;
  const canAccessDashboard = role === "admin" || role === "super_user" || role === "operator";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand selection:text-white overflow-x-hidden">
      {/* Background Subtle Elements */}
      <div className="fixed inset-0 pointer-events-none bg-noise" />
      <div className="fixed top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-brand/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] bg-brand/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Top Nav */}
      <nav aria-label="Navigazione principale" className="site-nav">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-effect site-nav-inner soft-shadow">
          <span className="site-brand text-brand">FULLART</span>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <Link href="#servizi" className="hover:text-brand transition-colors">Servizi</Link>
            <Link href="#manifesto" className="hover:text-brand transition-colors">Manifesto</Link>
            <Link href="/wellness" className="hover:text-brand transition-colors">Wellness</Link>
            <Link href="/products" className="hover:text-brand transition-colors">Products</Link>
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

            <Link href="/book-appointment" className="hidden sm:block">
              <Button size="sm" className="bg-brand hover:bg-brand-hover text-white rounded-xl px-4 sm:px-6 transition-all shadow-lg shadow-brand/20 h-9 sm:h-10 text-xs sm:text-sm font-bold">
                PRENOTA
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content">
      {/* Hero Section */}
      <section className="relative page-hero overflow-hidden">
        <div className="site-shell grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="relative z-10"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-brand/10 text-brand px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
              <Sparkles className="w-3 h-3" />
              Sinfonia di Stile & Benessere
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="hero-title md:text-8xl font-bold tracking-tighter mb-8 text-balance"
            >
              L'arte del <span className="text-brand italic font-serif">design</span>,<br />
              il rituale della <span className="text-brand">cura</span>.
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              className="lede text-muted font-medium max-w-xl mb-10 md:mb-12 leading-relaxed"
            >
              Oltre il semplice taglio. Un'esperienza sensoriale dove l'eccellenza estetica incontra il benessere profondo.
            </motion.p>

            <motion.div variants={fadeInUp} className="mobile-actions flex flex-col sm:flex-row gap-4 mt-4">
              <Link href="/book-appointment" className="w-full sm:w-auto">
                <Button size="lg" className="bg-brand hover:bg-brand-hover text-white rounded-2xl text-base sm:text-lg h-14 sm:h-16 px-8 sm:px-10 transition-all shadow-xl shadow-brand/20 group w-full sm:w-auto">
                  Inizia il Viaggio
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/wellness" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="border-brand/20 text-brand hover:bg-brand/5 rounded-2xl text-base sm:text-lg h-14 sm:h-16 px-8 sm:px-10 w-full sm:w-auto">
                  Esplora Servizi
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden soft-shadow relative">
               <div className="absolute inset-0 bg-brand/5 mix-blend-overlay z-10" />
               <Image
                 src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop"
                 alt="Barbiere al lavoro in un salone moderno"
                 fill
                 sizes="(max-width: 1024px) 0vw, 45vw"
                 className="object-cover grayscale-[20%] hover:scale-105 transition-transform duration-1000"
                 priority
               />
            </div>
            <div className="absolute -bottom-10 -left-10 glass-effect p-8 rounded-3xl soft-shadow max-w-[280px]">
              <div className="flex gap-4 mb-4">
                <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center text-white">
                  <Leaf className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">Prodotti Organic</h4>
                  <p className="text-xs text-muted">100% Sostenibili e Premium</p>
                </div>
              </div>
              <p className="text-sm italic">"Il miglior rituale che abbia mai provato. Eccellenza in ogni dettaglio."</p>
            </div>
          </motion.div>
        </div>

        {/* Mobile hero image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="lg:hidden site-shell mt-4 mb-2"
        >
          <div className="aspect-[16/9] rounded-[2rem] overflow-hidden soft-shadow relative">
            <Image
              src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop"
              alt="Barbiere al lavoro in un salone moderno"
              fill
              sizes="100vw"
              className="object-cover grayscale-[20%]"
              priority
            />
          </div>
        </motion.div>

        {/* Floating Badges */}
        <div className="absolute top-[20%] right-[10%] opacity-10 pointer-events-none hidden xl:block">
          <span className="text-[12vw] font-black tracking-tighter uppercase select-none">Wellness</span>
        </div>
      </section>

      {/* Features — numbered list, not identical card grid */}
      <section className="section-space border-t border-brand/10">
        <div className="site-shell">
          {[
            { num: "01", title: "Hair Design", desc: "Tagli sartoriali progettati sulla fisionomia del tuo volto. Ogni dettaglio, pensato per te." },
            { num: "02", title: "Rituali Wellness", desc: "Trattamenti pelle e capelli con ingredienti bio-attivi. Benessere che si vede e si sente." },
            { num: "03", title: "Eccellenza", desc: "Standard qualitativi elevati per un'utenza esigente. Nessun compromesso." },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
              className="flex items-start md:items-center gap-8 py-10 border-b border-brand/10 group last:border-b-0"
            >
              <span className="text-5xl md:text-7xl font-black text-brand/15 group-hover:text-brand/30 transition-colors leading-none select-none tabular-nums shrink-0">{feature.num}</span>
              <div className="flex-1 md:grid md:grid-cols-2 md:gap-16 items-center">
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground mt-2 md:mt-0 text-lg leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="servizi" className="section-space">
        <div className="site-shell">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-20 gap-6">
            <div className="max-w-2xl">
              <span className="text-brand font-bold tracking-widest uppercase text-sm mb-4 block">Esperienze</span>
              <h2 className="section-title font-bold tracking-tighter">I nostri rituali.</h2>
            </div>
            <Link href="/wellness" className="text-brand font-semibold group flex items-center gap-2">
              Vedi tutto <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-12 gap-5 md:gap-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="md:col-span-7 mobile-media-card overflow-hidden relative group"
            >
              <Image
                src="https://images.unsplash.com/photo-1621605815841-28d944683b83?q=80&w=2070&auto=format&fit=crop"
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 58vw"
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-12 flex flex-col justify-end text-white">
                <h3 className="text-4xl font-bold mb-4">Taglio & Modellatura</h3>
                <p className="max-w-md opacity-80 mb-6">Un'evoluzione del classico barbershop in chiave hair design moderno.</p>
                <Link href="/book-appointment">
                  <Button className="bg-white text-black hover:bg-brand hover:text-white w-fit rounded-xl">Prenota Ora</Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="md:col-span-5 mobile-media-card overflow-hidden relative group"
            >
              <Image
                src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop"
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand/90 to-transparent p-12 flex flex-col justify-end text-white">
                <h3 className="text-4xl font-bold mb-4">Wellness Spa</h3>
                <p className="max-w-md opacity-80 mb-6">Massaggi craniali e trattamenti viso per un relax rigenerante.</p>
                <Link href="/wellness">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-brand w-fit rounded-xl">Scopri il benessere</Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section id="manifesto" className="section-space bg-brand text-white overflow-hidden relative">
        <div className="site-shell relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <div>
               <h2 className="hero-title md:text-8xl font-bold tracking-tighter mb-8 md:mb-12">
                 Manifesto dell'eleganza.
               </h2>
               <div className="space-y-6 md:space-y-8 lede opacity-90 leading-relaxed font-light">
                 <p>
                   Crediamo che ogni uomo meriti una pausa dal rumore del mondo. Uno spazio dove l'estetica non è vanità, ma espressione di sé.
                 </p>
                 <p>
                   In FullArt, uniamo la precisione chirurgica del taglio con la dolcezza dei trattamenti wellness più avanzati.
                 </p>
               </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-white/5 rounded-[2rem] md:rounded-[4rem] backdrop-blur-3xl flex items-center justify-center p-6 md:p-12">
                <p className="text-3xl md:text-6xl font-serif italic text-center">
                  "La bellezza è l'armonia tra ciò che siamo e ciò che mostriamo."
                </p>
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse" />
            </div>
          </div>
        </div>
        <div className="absolute -bottom-20 -right-20 text-[20vw] font-black opacity-5 pointer-events-none uppercase">
          FullArt
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-space">
        <div className="site-shell">
        <div className="max-w-5xl mx-auto glass-effect mobile-card md:p-24 text-center soft-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent" />
          <h2 className="section-title font-bold tracking-tighter mb-8">
            Sei pronto al tuo <span className="text-brand">cambiamento</span>?
          </h2>
          <p className="lede text-muted mb-10 md:mb-12 max-w-2xl mx-auto">
            Prenota il tuo appuntamento oggi e scopri perché FullArt è il punto di riferimento per l'uomo moderno.
          </p>
          <div className="mobile-actions flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mt-6">
            <Link href="/book-appointment" className="w-full sm:w-auto">
              <Button size="lg" className="bg-brand hover:bg-brand-hover text-white rounded-2xl text-lg sm:text-xl h-14 sm:h-20 px-8 sm:px-12 shadow-2xl shadow-brand/20 transition-all hover:scale-105 active:scale-95 w-full">
                Prenota Sessione
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-brand/20 text-brand hover:bg-brand/5 rounded-2xl text-lg sm:text-xl h-14 sm:h-20 px-8 sm:px-12 transition-all w-full sm:w-auto">
              Contattaci
            </Button>
          </div>
        </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="py-14 md:py-20 border-t border-brand/10">
        <div className="site-shell grid sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-20">
          <div className="col-span-2">
            <span className="text-3xl font-bold text-brand mb-6 block">FULLART</span>
            <p className="text-muted max-w-sm text-lg">
              L'eccellenza nel design dei capelli e nella cura del benessere maschile. Via della Bellezza 12, Milano.
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
