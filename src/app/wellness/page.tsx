"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Clock, Sparkles, Leaf, Wind, X, CheckCircle2, LayoutDashboard } from "lucide-react";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";

const posts = [
  {
    tag: "SKIN CARE",
    title: "Hydra Boost Treatment",
    excerpt:
      "Idratazione profonda con acido ialuronico e peptidi attivi. Una sessione che resetta la tua pelle e dona nuova luce.",
    readTime: "5 min",
    icon: <Wind className="w-5 h-5" />,
    span: "md:col-span-8",
    price: "da 45€",
    duration: "45 minuti",
    benefits: "Pelle visibilmente rimpolpata, idratazione profonda a lunga durata e ripristino del film idrolipidico cutaneo.",
    steps: [
      "Detersione dermo-purificante e tonificazione viso preparatoria.",
      "Peeling enzimatico delicato per rimuovere lo strato corneo superficiale.",
      "Infusione transdermica di siero concentrato ad acido ialuronico multipeso e peptidi attivi.",
      "Massaggio mio-tensivo rilassante per stimolare l'assorbimento profondo."
    ]
  },
  {
    tag: "MASSAGGIO",
    title: "Deep Tissue Reset",
    excerpt:
      "Tecnica di decompressione muscolare avanzata. Scioglie le tensioni e rigenera il corpo in profondità.",
    readTime: "4 min",
    icon: <Sparkles className="w-5 h-5" />,
    span: "md:col-span-4",
    price: "da 60€",
    duration: "50 minuti",
    benefits: "Scioglimento istantaneo delle contratture accumulate, riduzione dello stress psicofisico e recupero muscolare ottimale.",
    steps: [
      "Frizione calda preparatoria alle essenze biologiche di arnica e iperico.",
      "Digitopressione localizzata e allungamento passivo dei fasci muscolari.",
      "Manovre profonde ad azione decontratturante ad alta pressione.",
      "Impacco tiepido finale alle erbe alpine riattivanti."
    ]
  },
  {
    tag: "BARBER SPA",
    title: "Hot Towel Ritual",
    excerpt:
      "L'antico rituale barber elevato a cerimonia sensoriale. Olio di Argan puro e rasoio a mano libera.",
    readTime: "6 min",
    icon: <Leaf className="w-5 h-5" />,
    span: "md:col-span-12",
    price: "da 35€",
    duration: "40 minuti",
    benefits: "Rilassamento profondo del sistema nervoso, purificazione dei pori cutanei e pelle preparata a rasatura impeccabile zero irritazioni.",
    steps: [
      "Massaggio con olio biologico pre-shave protettivo ed emolliente.",
      "Primo panno caldo aromatizzato all'essenza naturale di eucalipto.",
      "Applicazione di sapone caldo montato a pennello in tasso.",
      "Rasatura tradizionale a mano libera e secondo panno caldo aromaterapico.",
      "Balsamo lenitivo freddo e massaggio rivitalizzante finale."
    ]
  },
  {
    tag: "HAIR CARE",
    title: "Keratin Restructure",
    excerpt:
      "Trattamento ristrutturante profondo. Restituisce forza, elasticità e lucentezza naturale ai tuoi capelli.",
    readTime: "7 min",
    icon: <Sparkles className="w-5 h-5" />,
    span: "md:col-span-4",
    price: "da 50€",
    duration: "45 minuti",
    benefits: "Steli capillari ispessiti e rinvigoriti, eliminazione totale del crespo e lucentezza naturale specchiata protettiva.",
    steps: [
      "Shampoo purificante alcalino per aprire le squame cuticolari.",
      "Applicazione di cheratina idrolizzata concentrata e massaggio fibra per fibra.",
      "Posa termica controllata sotto fonte di calore delicata e secca.",
      "Risciacquo acido sigillante e applicazione di finish lucido protettivo."
    ]
  },
  {
    tag: "ANTI-AGING",
    title: "Collagen Infusion",
    excerpt:
      "Stimolazione naturale del collagene con tecnologie non invasive. Risultati visibili e duraturi.",
    readTime: "5 min",
    icon: <Wind className="w-5 h-5" />,
    span: "md:col-span-8",
    price: "da 55€",
    duration: "45 minuti",
    benefits: "Effetto lifting naturale immediato, aumento dell'elasticità cutanea e riduzione visibile delle rughe mimiche.",
    steps: [
      "Pulizia profonda del viso con tecnologia ad ultrasuoni.",
      "Applicazione di booster al collagene marino nativo concentrato.",
      "Massaggio rivitalizzante con sfere fredde riattivatrici del microcircolo.",
      "Crema barriera anti-ossidante finale ad ampio spettro."
    ]
  },
];

export default function WellnessPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;
  const canAccessDashboard = role === "admin" || role === "super_user" || role === "operator";
  const [selectedPost, setSelectedPost] = useState<typeof posts[0] | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand selection:text-white overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none bg-noise opacity-50 z-[-1]" />
      <div className="fixed top-0 right-0 w-[50vw] h-[50vw] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="site-nav">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-effect site-nav-inner soft-shadow">
          <Link href="/" className="site-brand text-brand">
            FULLART
          </Link>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <Link href="/wellness" className="hover:text-brand transition-colors font-bold text-brand">Wellness</Link>
            <Link href="/products" className="hover:text-brand transition-colors">Products</Link>
            <Link href="/appointments" className="hover:text-brand transition-colors">I miei appuntamenti</Link>
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
               <Button size="sm" className="bg-brand hover:bg-brand-hover text-white rounded-xl px-4 sm:px-6 transition-all h-9 sm:h-10 text-xs sm:text-sm font-bold">
                 PRENOTA
               </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative page-hero overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="site-shell max-w-5xl text-center"
        >
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-8">
            Rituali & Benessere
          </div>
          <h1 className="hero-title md:text-[8vw] font-bold tracking-tighter mb-8">
            Corpo, mente e <span className="text-brand italic font-serif">spirito</span>.
          </h1>
          <p className="lede text-muted font-medium max-w-2xl mx-auto leading-relaxed border-t border-brand/10 pt-6 md:pt-8">
            Un'oasi di tranquillità nel cuore urbano. Trattamenti curati nei minimi dettagli per l'uomo contemporaneo.
          </p>
        </motion.div>
      </section>

      {/* Blog Grid */}
      <section className="relative section-space bg-surface/30">
        <div className="site-shell">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-4">
            <div>
              <h2 className="section-title font-bold tracking-tight">I nostri trattamenti.</h2>
              <p className="text-muted mt-4">Scopri i rituali esclusivi firmati FullArt.</p>
            </div>
            <div className="text-brand/30 text-8xl font-black select-none hidden md:block">01</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8">
            {posts.map((post, index) => (
              <motion.article
                key={post.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                onClick={() => setSelectedPost(post)}
                className={`${post.span} group bg-card mobile-card hover:shadow-2xl hover:shadow-brand/10 transition-all duration-500 cursor-pointer flex flex-col justify-between soft-shadow border border-brand/5`}
              >
                <div>
                  <div className="flex justify-between items-start mb-7 md:mb-10">
                    <div className="w-12 h-12 bg-brand/5 text-brand rounded-2xl flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all duration-500">
                      {post.icon}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-brand mb-4 tracking-widest uppercase">
                    {post.tag}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 group-hover:text-brand transition-colors duration-300">{post.title}</h3>
                  <p className="text-muted text-base md:text-lg leading-relaxed mb-8 group-hover:text-foreground transition-colors duration-300">
                    {post.excerpt}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-brand font-bold text-sm group-hover:gap-4 transition-all">
                  SCOPRI DI PIÙ <span className="text-lg">→</span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-space">
        <div className="site-shell">
        <div className="max-w-4xl mx-auto bg-brand mobile-card md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-brand/30">
          <div className="relative z-10">
            <h2 className="section-title font-bold tracking-tighter mb-8">Rigenera il tuo stile.</h2>
            <p className="lede opacity-80 mb-10 md:mb-12 font-light">
              Ritagliati un momento di puro benessere. La tua pelle e i tuoi capelli ti ringrazieranno.
            </p>
            <div className="mobile-actions flex flex-col sm:flex-row gap-6 justify-center mt-6">
              <Link href="/book-appointment" className="w-full sm:w-auto">
                <Button size="lg" className="bg-white text-brand hover:bg-white/90 rounded-2xl text-lg sm:text-xl h-14 sm:h-20 px-8 sm:px-12 transition-all hover:scale-105 active:scale-95 shadow-xl w-full">
                  Prenota Ora
                </Button>
              </Link>
            </div>
          </div>
          {/* Decorative icons */}
          <Leaf className="absolute top-[-20px] left-[-20px] w-40 h-40 opacity-10 rotate-[-12deg]" />
          <Wind className="absolute bottom-[-40px] right-[-40px] w-60 h-60 opacity-10" />
        </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-14 md:py-20 border-t border-brand/10">
        <div className="site-shell flex flex-col md:flex-row justify-between items-center gap-8">
           <Link href="/" className="flex items-center gap-2 text-muted hover:text-brand transition-all font-semibold uppercase tracking-widest text-sm">
             <ArrowLeft className="w-4 h-4" /> Torna alla Home
           </Link>
           <div className="text-center md:text-right">
             <p className="font-bold text-brand mb-1">FULLART</p>
             <p className="text-xs text-muted font-medium tracking-[0.2em] uppercase">Hair Designer and Care © 2024</p>
           </div>
        </div>
      </footer>

      {/* Immersive Detail Drawer / BottomSheet */}
      <AnimatePresence>
        {selectedPost && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 pointer-events-auto"
            />

            {/* Content Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-card border-t border-brand/10 rounded-t-[3rem] z-50 p-6 md:p-10 soft-shadow pointer-events-auto max-h-[85vh] overflow-y-auto no-scrollbar pb-24"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8 opacity-40" />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-bold text-brand uppercase tracking-widest bg-brand/10 px-3 py-1 rounded-full">
                    {selectedPost.tag}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold mt-3 tracking-tight">{selectedPost.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-2 rounded-full hover:bg-muted transition-colors border border-brand/5 focus:outline-none cursor-pointer"
                  aria-label="Chiudi dettagli"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-brand/5">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Durata</p>
                      <p className="font-bold text-sm text-foreground">{selectedPost.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-brand shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Prezzo indicativo</p>
                      <p className="font-bold text-sm text-brand">{selectedPost.price}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Descrizione</h4>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{selectedPost.excerpt}</p>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Benefici</h4>
                  <div className="flex items-start gap-3 bg-brand/5 p-4 rounded-2xl border border-brand/10">
                    <CheckCircle2 className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">{selectedPost.benefits}</p>
                  </div>
                </div>

                {/* Ritual Steps */}
                <div>
                  <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Fasi del Rituale</h4>
                  <ol className="space-y-3.5">
                    {selectedPost.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-4 items-start">
                        <span className="font-serif italic text-brand text-xl font-bold shrink-0 w-6">0{idx + 1}</span>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-0.5">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Book Action */}
                <div className="pt-6 border-t border-brand/10">
                  <Link href="/book-appointment">
                    <Button size="lg" className="w-full bg-brand hover:bg-brand-hover text-white rounded-2xl h-14 font-bold flex items-center justify-center gap-2 select-none cursor-pointer">
                      Prenota questo rituale ora
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
