"use client";

import { Home, Sparkles, ShoppingBag, Calendar, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

export function MobileTabBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isSignedIn } = useUser();

  if (pathname?.startsWith("/admin")) return null;

  const isAppointmentsView = pathname === "/appointments";
  const isBookingView = pathname === "/book-appointment";

  const tabs = [
    {
      label: "Home",
      icon: Home,
      href: "/",
      isActive: pathname === "/",
    },
    {
      label: "Wellness",
      icon: Sparkles,
      href: "/wellness",
      isActive: pathname === "/wellness",
    },
    {
      label: "Prenota",
      icon: Calendar,
      href: "/book-appointment",
      isActive: isBookingView,
      isCenter: true,
    },
    {
      label: "Products",
      icon: ShoppingBag,
      href: "/products",
      isActive: pathname === "/products",
    },
    {
      label: "Miei",
      icon: User,
      href: "/appointments",
      isActive: isAppointmentsView,
      isProfile: true,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden p-4 pointer-events-none pb-safe">
      <motion.nav 
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 30, delay: 0.2 }}
        className="max-w-md mx-auto glass-effect rounded-[2rem] px-3 py-2 flex items-center justify-between pointer-events-auto soft-shadow border border-brand/15 bg-background/80"
        aria-label="Navigazione mobile inferiore"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;

          if (tab.isCenter) {
            return (
              <Link 
                key={tab.label}
                href={tab.href}
                className="relative flex flex-col items-center justify-center -translate-y-5 select-none focus:outline-none"
                aria-label="Prenota un appuntamento"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="size-14 bg-brand text-white rounded-full flex items-center justify-center shadow-lg shadow-brand/40 border-4 border-background relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-brand-hover to-white/20" />
                  <Icon className="w-6 h-6 relative z-10 animate-pulse" />
                </motion.div>
                <span className="text-[10px] font-bold text-brand uppercase tracking-wider mt-1 bg-background/90 px-2 py-0.5 rounded-full border border-brand/10 shadow-sm">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="relative flex-1 flex flex-col items-center justify-center py-2 select-none focus:outline-none"
              aria-label={tab.label}
            >
              {tab.isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 mx-1 bg-brand/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <div className="relative flex flex-col items-center gap-1 z-10">
                {tab.isProfile && isSignedIn && user?.imageUrl ? (
                  <div className={`size-6 rounded-full overflow-hidden border transition-all ${tab.isActive ? 'border-brand scale-110' : 'border-muted-foreground/30'}`}>
                    <Image 
                      src={user.imageUrl} 
                      alt="Profilo" 
                      width={24} 
                      height={24} 
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 transition-all duration-300 ${tab.isActive ? 'text-brand scale-110 stroke-[2.5]' : 'text-muted-foreground/80 stroke-[2]'}`} />
                )}
                
                <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${tab.isActive ? 'text-brand' : 'text-muted-foreground'}`}>
                  {tab.label}
                </span>
              </div>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}
