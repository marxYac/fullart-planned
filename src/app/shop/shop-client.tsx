"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Sparkles, Package, ShieldCheck, Plus, Search } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { MobileMenu } from "@/components/mobile-menu";
import Image from "next/image";
import { useState } from "react";

const categories = [
  { name: "STYLING", count: "12 PRODOTTI", icon: <Sparkles className="w-8 h-8" />, span: "md:col-span-8", id: "styling" },
  { name: "HAIR CARE", count: "08 PRODOTTI", icon: <Package className="w-8 h-8" />, span: "md:col-span-4", id: "hair_care" },
  { name: "SKIN CARE", count: "06 PRODOTTI", icon: <ShieldCheck className="w-8 h-8" />, span: "md:col-span-5", id: "skin_care" },
  { name: "FRAGRANZE", count: "04 PRODOTTI", icon: <ShoppingBag className="w-8 h-8" />, span: "md:col-span-7", id: "fragranze" },
];

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string | null;
  inStock: boolean;
};

export function ShopClient({ products }: { products: Product[] }) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.category?.toLowerCase() === activeCategory.replace('_', ' ').toLowerCase());

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand selection:text-white overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none bg-noise opacity-50 z-[-1]" />
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="site-nav">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass-effect site-nav-inner soft-shadow">
          <Link href="/" className="site-brand text-brand">
            FULLART
          </Link>
          <div className="nav-actions">
            <span className="hidden lg:inline text-[10px] font-bold text-muted tracking-[0.2em] uppercase">Shop / Premium Products</span>
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
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="site-shell max-w-5xl text-center relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-8">
            Collezione Esclusiva
          </div>
          <h1 className="hero-title md:text-[9vw] font-bold tracking-tighter mb-6">
            Materia <span className="text-brand italic font-serif">prima</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted font-medium max-w-2xl mx-auto leading-relaxed">
            Prodotti professionali curati dai nostri Hair Designer per il tuo stile quotidiano.
          </p>
        </motion.div>
      </section>

      {/* Categories Preview */}
      <section className="relative section-space bg-surface/30">
        <div className="site-shell">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-4">
            <div>
              <h2 className="section-title font-bold tracking-tight">Le Collezioni.</h2>
            </div>
            <div className="text-brand/20 text-8xl font-black select-none hidden md:block">03</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 mb-16">
            {categories.map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveCategory(cat.name.toLowerCase() === activeCategory ? "all" : cat.name.toLowerCase())}
                className={`${cat.span} group bg-card mobile-card hover:bg-brand hover:text-white transition-all duration-500 cursor-pointer flex flex-col items-center justify-center text-center soft-shadow border ${activeCategory === cat.name.toLowerCase() ? 'border-brand bg-brand/5' : 'border-brand/5'}`}
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mb-6 md:mb-8 transition-all duration-500 ${activeCategory === cat.name.toLowerCase() ? 'bg-brand text-white' : 'bg-brand/5 text-brand group-hover:bg-white/20 group-hover:text-white'}`}>
                  {cat.icon}
                </div>
                <h3 className="text-2xl md:text-4xl font-bold mb-4 tracking-tight">{cat.name}</h3>
                <div className={`h-[2px] w-12 mb-6 transition-colors ${activeCategory === cat.name.toLowerCase() ? 'bg-white' : 'bg-brand group-hover:bg-white/40'}`} />
                <p className={`text-xs font-bold uppercase tracking-widest ${activeCategory === cat.name.toLowerCase() ? 'text-white' : 'text-muted group-hover:text-white/80'}`}>{cat.count}</p>
              </motion.div>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold tracking-tight">
              {activeCategory === "all" ? "Tutti i Prodotti" : activeCategory.toUpperCase()}
            </h3>
            <span className="text-sm font-medium text-muted bg-surface px-3 py-1 rounded-full">
              {filteredProducts.length} risultati
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 4) * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col relative"
              >
                {/* Product Card Image */}
                <div className="relative aspect-[4/5] bg-surface rounded-2xl md:rounded-3xl overflow-hidden mb-5 soft-shadow border border-brand/5 group-hover:border-brand/20 transition-colors">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted">
                      <ShoppingBag className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  {!product.inStock && (
                    <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md text-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      Esaurito
                    </div>
                  )}
                  
                </div>

                {/* Product Info */}
                <div className="flex flex-col flex-1 px-1">
                  <div className="mb-2">
                    <h4 className="font-bold text-lg leading-tight group-hover:text-brand transition-colors">
                      {product.name}
                    </h4>
                  </div>
                  {product.category && (
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">
                      {product.category}
                    </span>
                  )}
                  {product.description && (
                    <p className="text-sm text-muted line-clamp-2 mt-auto">
                      {product.description}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center glass-effect rounded-3xl border border-brand/5">
                <Search className="w-12 h-12 text-brand/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Nessun prodotto trovato</h3>
                <p className="text-muted">Non ci sono prodotti disponibili in questa categoria al momento.</p>
                <Button 
                  variant="outline" 
                  className="mt-6 rounded-full"
                  onClick={() => setActiveCategory("all")}
                >
                  Vedi tutti i prodotti
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative section-space">
        <div className="site-shell">
        <div className="max-w-4xl mx-auto bg-brand mobile-card md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-brand/30">
          <div className="relative z-10">
            <h2 className="section-title font-bold tracking-tighter mb-8">Resta aggiornato.</h2>
            <p className="lede opacity-80 mb-10 md:mb-12 font-light max-w-lg mx-auto">
              Iscriviti alla nostra newsletter per ricevere novità sui prodotti e sconti esclusivi.
            </p>
            
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Indirizzo Email"
                className="min-w-0 flex-1 bg-white/10 border border-white/20 rounded-2xl px-5 sm:px-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 transition-all"
              />
              <Button className="bg-white text-brand hover:bg-white/90 rounded-2xl px-8 h-auto py-4 font-bold tracking-widest shadow-xl">
                ISCRIVITI
              </Button>
            </form>
          </div>
          <ShoppingBag className="absolute bottom-[-40px] left-[-40px] w-64 h-64 opacity-10 rotate-12 pointer-events-none" />
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
             <p className="font-bold text-brand mb-1 text-lg">FULLART</p>
             <p className="text-[10px] text-muted font-medium tracking-[0.2em] uppercase">Materia Prima Premium © 2024</p>
           </div>
        </div>
      </footer>
    </div>
  );
}
