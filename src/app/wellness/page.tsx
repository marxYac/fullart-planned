"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Clock, Sparkles, Leaf, Wind } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { MobileMenu } from "@/components/mobile-menu";

const posts = [
  {
    tag: "SKIN CARE",
    title: "Hydra Boost Treatment",
    excerpt:
      "Idratazione profonda con acido ialuronico e peptidi attivi. Una sessione che resetta la tua pelle e dona nuova luce.",
    readTime: "5 min",
    icon: <Wind className="w-5 h-5" />,
    span: "md:col-span-8",
  },
  {
    tag: "MASSAGGIO",
    title: "Deep Tissue Reset",
    excerpt:
      "Tecnica di decompressione muscolare avanzata. Scioglie le tensioni e rigenera il corpo in profondità.",
    readTime: "4 min",
    icon: <Sparkles className="w-5 h-5" />,
    span: "md:col-span-4",
  },
  {
    tag: "BARBER SPA",
    title: "Hot Towel Ritual",
    excerpt:
      "L'antico rituale barber elevato a cerimonia sensoriale. Olio di Argan puro e rasoio a mano libera.",
    readTime: "6 min",
    icon: <Leaf className="w-5 h-5" />,
    span: "md:col-span-12",
  },
  {
    tag: "HAIR CARE",
    title: "Keratin Restructure",
    excerpt:
      "Trattamento ristrutturante profondo. Restituisce forza, elasticità e lucentezza naturale ai tuoi capelli.",
    readTime: "7 min",
    icon: <Sparkles className="w-5 h-5" />,
    span: "md:col-span-4",
  },
  {
    tag: "ANTI-AGING",
    title: "Collagen Infusion",
    excerpt:
      "Stimolazione naturale del collagene con tecnologie non invasive. Risultati visibili e duraturi.",
    readTime: "5 min",
    icon: <Wind className="w-5 h-5" />,
    span: "md:col-span-8",
  },
];

export default function WellnessPage() {
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
          <div className="nav-actions">
            <span className="hidden lg:inline text-[10px] font-bold text-muted tracking-[0.2em] uppercase">Wellness / Experience</span>
            <ModeToggle />
            <Link href="/book-appointment" className="hidden sm:block">
               <Button size="sm" className="bg-brand hover:bg-brand-hover text-white rounded-xl px-4 sm:px-6 transition-all h-9 sm:h-10 text-xs sm:text-sm font-bold">
                 PRENOTA
               </Button>
            </Link>
            <MobileMenu />
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
    </div>
  );
}
