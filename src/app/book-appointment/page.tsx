"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SignInButton, useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight,
  Calendar as CalendarIcon, 
  Camera, 
  Leaf, 
  Phone, 
  Sparkles, 
  User, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Scissors,
  Star,
  Droplet,
  Flame,
  Zap,
  Crown,
  LayoutDashboard
} from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";

import { useEffect } from "react";
import { 
  getServices, 
  getOperators, 
  createAppointment, 
  getUserAppointments,
  getBookedSlots
} from "@/lib/actions/booking";
import Image from "next/image";
import { toast } from "sonner";


const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Icone dinamiche (DB) o fallback su categoria
const serviceIcons: Record<string, React.ReactNode> = {
  "Scissors": <Scissors className="w-5 h-5" />,
  "User": <User className="w-5 h-5" />,
  "Star": <Star className="w-5 h-5" />,
  "Sparkles": <Sparkles className="w-5 h-5" />,
  "Droplet": <Droplet className="w-5 h-5" />,
  "Clock": <Clock className="w-5 h-5" />,
  "Flame": <Flame className="w-5 h-5" />,
  "Zap": <Zap className="w-5 h-5" />,
  "Crown": <Crown className="w-5 h-5" />,
  "Leaf": <Leaf className="w-5 h-5" />,
  "hair": <Sparkles className="w-5 h-5" />,
  "beard": <Leaf className="w-5 h-5" />,
  "wellness": <Sparkles className="w-5 h-5" />,
  "default": <Sparkles className="w-5 h-5" />
};


export default function BookAppointmentPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;
  const canAccessDashboard = role === "admin" || role === "super_user" || role === "operator";
  const [view, setView] = useState("booking"); // "booking" or "appointments"
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [dbOperators, setDbOperators] = useState<any[]>([]);
  const [dbAppointments, setDbAppointments] = useState<any[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  const [bookingData, setBookingData] = useState<{
    service: any;
    operator: any;
    date: Date | null;
    time: string | null;
  }>({
    service: null,
    operator: null,
    date: null,
    time: null
  });

  // Caricamento dati dal database
  useEffect(() => {
    async function loadData() {
      const servicesRes = await getServices();
      if (servicesRes.success) setDbServices(servicesRes.data ?? []);
      
      const operatorsRes = await getOperators();
      if (operatorsRes.success) setDbOperators(operatorsRes.data ?? []);
      
      const appointmentsRes = await getUserAppointments();
      if (appointmentsRes.success) setDbAppointments(appointmentsRes.data ?? []);
    }
    loadData();
  }, [view]);

  // Gestione deep-linking dei parametri URL per mobile bottom tab bar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view");
    if (viewParam === "appointments") {
      setView("appointments");
    }
  }, []);


  // Calendar logic
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const handleSelectService = (service: any) => {
    setBookingData({ ...bookingData, service });
    setStep(2);
  };

  const handleSelectOperator = (operator: any) => {
    setBookingData({ ...bookingData, operator });
    setStep(3);
  };

  const handleSelectDate = async (date: Date) => {
    setBookingData({ ...bookingData, date });
    setStep(4);
    if (bookingData.operator) {
      setIsLoadingSlots(true);
      const res = await getBookedSlots(bookingData.operator.id, date.toISOString());
      if (res.success) {
        setBookedSlots(res.data || []);
      } else {
        setBookedSlots([]);
      }
      setIsLoadingSlots(false);
    }
  };

  const handleSelectTime = async (time: string) => {
    setIsSubmitting(true);
    const finalBookingData = { ...bookingData, time };
    setBookingData(finalBookingData);

    try {
      if (!bookingData.service || !bookingData.operator || !bookingData.date) {
        toast.error("Dati di prenotazione mancanti");
        return;
      }

      // Combina data e ora in un oggetto Date
      const [hours, minutes] = time.split(':');
      const appointmentDate = new Date(bookingData.date);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const result = await createAppointment({
        serviceId: bookingData.service.id,
        operatorId: bookingData.operator.id,
        appointmentDate: appointmentDate,
      });

      if (result.success) {
        setStep(5);
      } else {
        toast.error(result.error || "Errore durante la prenotazione");
      }
    } catch (error) {
      toast.error("Si è verificato un errore imprevisto");
    } finally {
      setIsSubmitting(false);
    }
  };


  const resetBooking = () => {
    setStep(1);
    setBookingData({ service: null, operator: null, date: null, time: null });
  };

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
            <Link href="/#servizi" className="hover:text-brand transition-colors">Servizi</Link>
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
                  className="flex hover:bg-brand/10 hover:text-brand transition-all font-semibold"
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
          </div>
        </div>
      </nav>

      <main id="main-content" className="page-hero pt-24 pb-20">
        <div className="site-shell max-w-4xl">
          {/* View Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-12"
          >
            <div className="glass-effect p-1.5 rounded-2xl flex gap-1 soft-shadow border border-brand/10">
              <button 
                onClick={() => setView("booking")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === "booking" ? "bg-brand text-white shadow-lg shadow-brand/20" : "hover:bg-brand/5 text-muted"}`}
              >
                Prenota
              </button>
              <button 
                onClick={() => setView("appointments")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === "appointments" ? "bg-brand text-white shadow-lg shadow-brand/20" : "hover:bg-brand/5 text-muted"}`}
              >
                Le mie prenotazioni
              </button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {view === "booking" ? (
              <motion.div
                key="booking-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Header Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-12"
                >
                  <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
                    <CalendarIcon className="w-3 h-3" />
                    {step === 5 ? "Prenotazione Confermata" : "Riserva la tua esperienza"}
                  </div>
                  
                  <h1 className="hero-title md:text-6xl font-bold tracking-tighter mb-4">
                    {step === 1 && <>Scegli il tuo <span className="text-brand italic font-serif">servizio</span></>}
                    {step === 2 && <>Scegli il tuo <span className="text-brand italic font-serif">barbiere</span></>}
                    {step === 3 && <>Scegli la <span className="text-brand italic font-serif">data</span></>}
                    {step === 4 && <>Scegli l' <span className="text-brand italic font-serif">orario</span></>}
                    {step === 5 && <>Rituale <span className="text-brand italic font-serif">confermato</span></>}
                  </h1>

                  {step < 5 && (
                    <div
                      className="flex justify-center gap-2 mt-8"
                      role="progressbar"
                      aria-label={`Passaggio ${step} di 4`}
                      aria-valuenow={step}
                      aria-valuemin={1}
                      aria-valuemax={4}
                    >
                      {[1, 2, 3, 4].map((s) => (
                        <div 
                          key={s} 
                          className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-brand' : 'w-4 bg-brand/10'}`} 
                        />
                      ))}
                    </div>
                  )}
                </motion.div>

                <div className="relative min-h-[400px]">
                  <AnimatePresence mode="wait">
                    {/* STEP 1: SERVICE */}
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={staggerContainer}
                        className="grid gap-4 md:gap-6"
                      >
                        {dbServices.map((service) => (
                          <motion.div
                            key={service.id}
                            variants={fadeInUp}
                            className="group relative"
                          >
                            <button
                              onClick={() => handleSelectService(service)}
                              className="w-full text-left bg-card p-6 md:p-8 rounded-[2rem] soft-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-transparent hover:border-brand/20 hover:bg-brand/[0.02] transition-all duration-500 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                              aria-label={`Seleziona ${service.name} — ${service.duration} minuti, ${service.price / 100}€`}
                            >
                              <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                              {/* Prezzo — solo mobile, posizione assoluta top-right */}
                              <div className="absolute top-5 right-6 z-20 md:hidden text-3xl font-black tracking-tighter text-brand">
                                {service.price / 100}€
                              </div>

                              <div className="flex items-center gap-6 relative z-10">
                                <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all duration-500 shadow-inner">
                                  {serviceIcons[service.icon as string] || serviceIcons[service.category as string] || serviceIcons.default}
                                </div>
                                <div>
                                  <h3 className="text-2xl font-bold tracking-tight mb-1">{service.name}</h3>
                                  <p className="text-muted-foreground font-medium flex items-center gap-2">
                                    <CalendarIcon className="w-3.5 h-3.5" />
                                    {service.duration} min
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-8 relative z-10">
                                {/* Prezzo — solo desktop */}
                                <div className="hidden md:block text-3xl font-black tracking-tighter text-brand">
                                  {service.price / 100}€
                                </div>
                                <span className="bg-brand hover:bg-brand-hover text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-brand/20 transition-all flex items-center">
                                  SELEZIONA
                                </span>
                              </div>
                            </button>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}

                    {/* STEP 2: OPERATOR */}
                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={staggerContainer}
                        className="grid md:grid-cols-2 gap-6"
                      >
                        {dbOperators.map((op) => (
                          <motion.div
                            key={op.id}
                            variants={fadeInUp}
                            className="group relative"
                          >
                            <button
                              onClick={() => handleSelectOperator(op)}
                              aria-label={`Scegli ${op.name}`}
                              className="w-full bg-card p-8 rounded-[3rem] text-center soft-shadow border border-transparent hover:border-brand/20 transition-all duration-500 h-full flex flex-col items-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            >
                              <div className="size-32 rounded-full overflow-hidden mb-6 border-4 border-brand/10 group-hover:border-brand/30 transition-all relative">
                                <Image src={op.imageUrl || "/placeholder-avatar.png"} alt={op.name || "Operatore"} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="128px" />
                              </div>
                              <h3 className="text-2xl font-bold mb-2">{op.name}</h3>
                              <p className="text-brand font-medium tracking-wide uppercase text-xs mb-8">{op.role}</p>
                              <span className="w-full border border-brand/20 text-brand hover:bg-brand hover:text-white rounded-2xl h-12 flex items-center justify-center font-bold transition-colors">
                                SCEGLI {(op.name || "Operatore").toUpperCase()}
                              </span>
                            </button>
                          </motion.div>
                        ))}

                        <motion.div variants={fadeInUp} className="md:col-span-2 flex justify-center mt-8">
                          <Button variant="ghost" onClick={() => setStep(1)} className="text-muted hover:text-brand">
                            <ChevronLeft className="mr-2 h-4 w-4" /> Cambia servizio
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* STEP 3: CALENDAR */}
                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={fadeInUp}
                        className="glass-effect p-8 rounded-[3rem] soft-shadow border border-brand/10 max-w-2xl mx-auto"
                      >
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-2xl font-bold capitalize">
                            {currentMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}
                          </h3>
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={prevMonth} className="rounded-full">
                              <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={nextMonth} className="rounded-full">
                              <ChevronRight className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2 mb-4">
                          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) => (
                            <div key={d} className="text-center text-[10px] font-bold text-muted uppercase tracking-widest py-2">
                              {d}
                            </div>
                          ))}
                          {daysInMonth.length > 0 && Array.from({ length: (daysInMonth[0].getDay() + 6) % 7 }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square" />
                          ))}
                          {daysInMonth.map((date, idx) => {
                            const isToday = new Date().toDateString() === date.toDateString();
                            const isSelected = bookingData.date?.toDateString() === date.toDateString();
                            const dayOfWeek = date.getDay();
                            // Dal martedì (2) al sabato (6). Domenica è 0, Lunedì è 1.
                            const isClosed = dayOfWeek === 0 || dayOfWeek === 1;
                            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                            const isDisabled = isPast || isClosed;
                            
                            return (
                              <button
                                key={idx}
                                onClick={() => !isDisabled && handleSelectDate(date)}
                                disabled={isDisabled}
                                aria-label={`${date.getDate()} ${date.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}${isClosed ? ' — chiuso' : isPast ? ' — passato' : ''}`}
                                aria-pressed={isSelected}
                                className={`
                                  aspect-square flex items-center justify-center rounded-2xl text-sm font-bold transition-all
                                  ${isDisabled ? 'text-muted-foreground/40 cursor-not-allowed' : 'hover:bg-brand/10 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'}
                                  ${isSelected ? 'bg-brand text-white hover:bg-brand hover:text-white' : ''}
                                  ${isToday && !isSelected ? 'border border-brand/30 text-brand' : ''}
                                `}
                              >
                                {date.getDate()}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex justify-between mt-10">
                          <Button variant="ghost" onClick={() => setStep(2)} className="text-muted hover:text-brand">
                            <ChevronLeft className="mr-2 h-4 w-4" /> Cambia barbiere
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 4: TIME SLOTS */}
                    {step === 4 && (
                      <motion.div
                        key="step4"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={fadeInUp}
                        className="glass-effect p-6 md:p-8 rounded-[3rem] soft-shadow border border-brand/10 max-w-2xl mx-auto"
                      >
                        <div className="text-center mb-8">
                          <p className="text-brand font-bold uppercase tracking-widest text-xs mb-2">Disponibilità per il</p>
                          <h3 className="text-2xl font-bold">
                            {bookingData.date?.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                          </h3>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {isLoadingSlots ? (
                            <div className="col-span-full text-center text-muted py-8 animate-pulse">
                              Ricerca disponibilità in corso...
                            </div>
                          ) : (
                            (() => {
                              const allSlots = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'];

                              if (allSlots.length === 0) {
                                return (
                                  <div className="col-span-full text-center text-muted py-8">
                                    Nessun orario disponibile.
                                  </div>
                                );
                              }

                              return allSlots.map((t) => {
                                const serviceDuration = bookingData.service?.duration || 30;
                                const [hours, minutes] = t.split(':').map(Number);
                                const startTimeInMinutes = hours * 60 + minutes;
                                const endTimeInMinutes = startTimeInMinutes + serviceDuration;
                                const closingTimeInMinutes = 20 * 60; // 20:00
                                
                                // Check if service exceeds closing time
                                const exceedsClosing = endTimeInMinutes > closingTimeInMinutes;
                                
                                // Check if any required 30-min slot is already booked
                                const slotsNeeded = Math.ceil(serviceDuration / 30);
                                let isBooked = false;
                                
                                for (let i = 0; i < slotsNeeded; i++) {
                                  const checkTimeInMins = startTimeInMinutes + i * 30;
                                  const h = Math.floor(checkTimeInMins / 60).toString().padStart(2, '0');
                                  const m = (checkTimeInMins % 60).toString().padStart(2, '0');
                                  if (bookedSlots.includes(`${h}:${m}`)) {
                                    isBooked = true;
                                    break;
                                  }
                                }

                                const isDisabled = isSubmitting || isBooked || exceedsClosing;

                                return (
                                  <Button
                                    key={t}
                                    variant="outline"
                                    disabled={isDisabled}
                                    onClick={() => handleSelectTime(t)}
                                    className={`rounded-2xl h-14 font-bold border-brand/10 transition-all ${isDisabled ? 'opacity-30 cursor-not-allowed bg-muted/10' : 'hover:border-brand hover:bg-brand/5 hover:text-brand'}`}
                                  >
                                    <Clock className="w-4 h-4 mr-1 md:mr-2 opacity-50 shrink-0" />
                                    {t}
                                  </Button>
                                );
                              });
                            })()
                          )}
                        </div>

                        <div className="flex justify-between mt-10">
                          <Button variant="ghost" onClick={() => setStep(3)} className="text-muted hover:text-brand">
                            <ChevronLeft className="mr-2 h-4 w-4" /> Cambia data
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 5: CONFIRMATION */}
                    {step === 5 && (
                      <motion.div
                        key="step5"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-effect p-10 md:p-16 rounded-[4rem] soft-shadow border border-brand/10 text-center max-w-2xl mx-auto overflow-hidden relative"
                      >
                        <div className="absolute top-0 left-0 w-full h-2 bg-brand" />
                        <div className="size-24 bg-brand text-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-brand/40 animate-bounce">
                          <CheckCircle2 className="size-12" />
                        </div>
                        
                        <h2 className="text-4xl font-bold mb-4 tracking-tight">Tutto pronto!</h2>
                        <p className="text-muted mb-10 text-lg">
                          Abbiamo ricevuto la tua richiesta. Riceverai un'email di conferma a breve.
                        </p>

                        {/* Premium Digital Boarding Pass / Ticket */}
                        <div className="max-w-md mx-auto bg-card border border-brand/10 rounded-[2.5rem] overflow-hidden soft-shadow text-left relative flex flex-col mb-10">
                          {/* Ticket Header */}
                          <div className="bg-brand text-white p-6 relative flex justify-between items-center overflow-hidden">
                            {/* Decorative background gradients */}
                            <div className="absolute inset-0 bg-gradient-to-r from-brand to-brand-hover" />
                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 rounded-full blur-xl" />
                            
                            <div className="relative z-10">
                              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/70">FullArt Barber Spa</span>
                              <h4 className="text-xl font-bold tracking-tight mt-0.5">Booking Pass</h4>
                            </div>
                            <div className="relative z-10 bg-white/15 px-3 py-1.5 rounded-xl border border-white/10 text-center">
                              <span className="block text-[8px] font-bold text-white/80 uppercase tracking-widest">Prezzo</span>
                              <span className="font-serif italic text-sm font-bold">{bookingData.service?.price / 100}€</span>
                            </div>
                          </div>

                          {/* Ticket Main Details */}
                          <div className="p-6 md:p-8 bg-card flex flex-col gap-6 relative">
                            {/* Client & Operator info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Servizio</span>
                                <span className="font-bold text-foreground text-sm sm:text-base leading-tight mt-1 block">{bookingData.service?.name}</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5 block">{bookingData.service?.duration} min</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Barber Designer</span>
                                <span className="font-bold text-foreground text-sm sm:text-base leading-tight mt-1 block">{bookingData.operator?.name}</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5 block">Poltrona 0{Math.floor(Math.random() * 3) + 1}</span>
                              </div>
                            </div>

                            {/* Date and Time info */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand/5">
                              <div>
                                <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Data</span>
                                <span className="font-bold text-foreground text-sm sm:text-base leading-tight mt-1 block">
                                  {bookingData.date?.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-muted uppercase tracking-wider block">Orario</span>
                                <span className="font-black text-brand text-base sm:text-lg tracking-tight mt-0.5 block">
                                  ore {bookingData.time}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Perforated Divider Section */}
                          <div className="relative h-6 bg-card flex items-center justify-between pointer-events-none">
                            {/* Circular notches */}
                            <div className="w-4 h-6 rounded-r-full bg-background border-r border-y border-brand/10 -ml-0.5" />
                            <div className="flex-1 border-t-2 border-dashed border-brand/15 mx-2" />
                            <div className="w-4 h-6 rounded-l-full bg-background border-l border-y border-brand/10 -mr-0.5" />
                          </div>

                          {/* Ticket Bottom Barcode Section */}
                          <div className="p-6 bg-muted/20 border-t border-brand/5 flex flex-col items-center justify-center gap-4 text-center">
                            {/* Simulated Barcode */}
                            <div className="flex flex-col items-center justify-center gap-1.5 w-full max-w-[200px] mx-auto select-none opacity-85">
                              <div className="h-10 w-full flex items-stretch gap-[1.5px] bg-foreground/5 p-1 rounded-sm">
                                {[...Array(38)].map((_, i) => {
                                  const widths = ["w-[1px]", "w-[2px]", "w-[3px]", "w-[1px]"];
                                  const widthClass = widths[i % widths.length];
                                  const isDark = (i * 7 + 13) % 11 > 3;
                                  return (
                                    <div 
                                      key={i} 
                                      className={`h-full ${widthClass} ${isDark ? 'bg-foreground' : 'bg-transparent'} flex-1`} 
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-[8px] font-mono text-muted tracking-[0.4em] uppercase">
                                FA-{bookingData.time?.replace(':', '')}-{bookingData.date?.getDate()}0{bookingData.date ? bookingData.date.getMonth() + 1 : 1}
                              </span>
                            </div>

                            <p className="text-[9px] font-semibold text-muted uppercase tracking-widest leading-relaxed max-w-[240px]">
                              Mostra questo pass all'accoglienza in salone.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button onClick={resetBooking} className="bg-brand hover:bg-brand-hover text-white rounded-2xl h-14 px-10 font-bold shadow-lg shadow-brand/20 transition-all hover:scale-105">
                            NUOVA PRENOTAZIONE
                          </Button>
                          <Link href="/">
                            <Button variant="ghost" className="h-14 px-10 rounded-2xl font-bold text-muted hover:text-brand">
                              TORNA ALLA HOME
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="appointments-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="max-w-3xl mx-auto"
              >
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
                    <User className="w-3 h-3" />
                    I tuoi appuntamenti
                  </div>
                  <h1 className="hero-title md:text-6xl font-bold tracking-tighter mb-4">
                    Gestisci i tuoi <span className="text-brand italic font-serif">rituali</span>.
                  </h1>
                </div>

                {isLoaded && !isSignedIn && (
                  <div className="glass-effect p-12 rounded-[3rem] text-center soft-shadow border border-brand/10">
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
                  </div>
                )}

                {isLoaded && isSignedIn && (
                  <div className="grid gap-6">
                    {dbAppointments.map((apt) => (
                      <div key={apt.id} className="glass-effect p-8 rounded-[2.5rem] soft-shadow border border-transparent hover:border-brand/10 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                          <CheckCircle2 className="size-20 text-brand" />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                          <div className="flex items-center gap-6">
                            <div className="size-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center font-black text-xl flex-col">
                              <span className="text-xs uppercase opacity-50">{new Date(apt.appointmentDate).toLocaleString('it-IT', { month: 'short' })}</span>
                              {new Date(apt.appointmentDate).getDate()}
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold mb-1">{apt.service?.name}</h3>
                              <p className="text-muted font-medium flex items-center gap-2 text-sm uppercase tracking-wider">
                                <User className="size-3.5" /> {apt.operator?.name} • <Clock className="size-3.5" /> {new Date(apt.appointmentDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${apt.status === "confirmed" ? "bg-emerald-500/10 text-emerald-500" : apt.status === "pending" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"}`}>
                              {apt.status === "confirmed" ? "Confermato" : apt.status === "pending" ? "In Attesa" : apt.status}
                            </div>
                            <Button variant="ghost" className="size-10 p-0 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors">
                              <ArrowLeft className="rotate-45 size-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {dbAppointments.length === 0 && (

                      <div className="glass-effect p-16 rounded-[3rem] text-center soft-shadow border border-brand/10">
                        <p className="text-muted italic">Non hai ancora prenotazioni attive.</p>
                        <Button 
                          onClick={() => setView("booking")} 
                          variant="link" 
                          className="text-brand font-bold mt-4 inline-flex items-center gap-1"
                        >
                          Prenota il tuo primo rituale <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Helper Section */}
          {view === "booking" && step < 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-20 pt-12 border-t border-brand/10 text-center"
            >
              <h2 className="text-2xl font-bold mb-4 italic font-serif text-brand">Hai bisogno di aiuto?</h2>
              <p className="text-muted max-w-lg mx-auto mb-8 font-medium">
                Se hai esigenze particolari o vuoi un trattamento personalizzato, contattaci direttamente.
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
          )}
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
