"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Camera, Globe, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
const menuLinks = [
  { href: "/", label: "Home" },
  { href: "/#servizi", label: "Servizi" },
  { href: "/wellness", label: "Wellness" },
  { href: "/products", label: "Products" },
  { href: "/book-appointment", label: "Prenotazioni" },
];

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;
  const canAccessDashboard = role === "admin" || role === "super_user" || role === "operator";
  const dynamicLinks = canAccessDashboard 
    ? [...menuLinks, { href: "/admin", label: "Dashboard" }]
    : menuLinks;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-brand hover:bg-brand/10 rounded-xl"
        onClick={() => setIsOpen(true)}
        aria-label="Apri menu di navigazione"
        aria-expanded={isOpen}
        aria-controls="mobile-menu-content"
      >
        <Menu className="w-6 h-6" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] lg:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            />

            {/* Menu Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 w-full max-w-sm h-full bg-card shadow-2xl flex flex-col border-l border-brand/10"
            >
              <div className="p-6 flex items-center justify-between border-b border-brand/5">
                <span className="font-bold text-brand tracking-tighter text-xl">FULLART</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-brand/10 rounded-xl"
                  onClick={() => setIsOpen(false)}
                  aria-label="Chiudi menu"
                >
                  <X className="w-6 h-6 text-brand" />
                </Button>
              </div>

              <nav
                id="mobile-menu-content"
                aria-label="Menu mobile"
                className="flex-1 overflow-y-auto py-8 px-6"
              >
                <div className="space-y-4">
                  {dynamicLinks.map((link, idx) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between group py-3 text-2xl font-bold tracking-tight hover:text-brand transition-colors"
                      >
                        {link.label}
                        <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand" />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-12 pt-12 border-t border-brand/5 space-y-8">
                  <div>
                    <h4 className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-4">Contatti</h4>
                    <a href="tel:+390000000000" className="flex items-center gap-3 text-lg font-medium hover:text-brand transition-colors">
                      <Phone className="w-5 h-5" /> +39 000 000 0000
                    </a>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-muted uppercase tracking-[0.2em] mb-4">Seguici</h4>
                    <div className="flex gap-4">
                      <a href="#" className="w-12 h-12 rounded-xl bg-brand/5 flex items-center justify-center hover:bg-brand hover:text-white transition-all">
                        <Camera className="w-5 h-5" />
                      </a>
                      <a href="#" className="w-12 h-12 rounded-xl bg-brand/5 flex items-center justify-center hover:bg-brand hover:text-white transition-all">
                        <Globe className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </nav>

              <div className="p-6">
                <Link href="/book-appointment" onClick={() => setIsOpen(false)}>
                  <Button className="w-full h-14 bg-brand hover:bg-brand-hover text-white rounded-2xl text-lg font-bold shadow-xl shadow-brand/20">
                    PRENOTA ORA
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
