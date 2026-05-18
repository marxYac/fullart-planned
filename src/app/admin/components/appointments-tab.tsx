"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getAppointmentsAction, 
  updateAppointmentStatusAction, 
  getOperatorsAction,
  AppointmentStatus 
} from "@/lib/actions/admin-appointments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon, 
  Search, 
  Filter, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Euro,
  TrendingUp,
  Hourglass,
  CalendarDays,
  Sparkles,
  ClipboardList,
  Check,
  ChevronDown
} from "lucide-react";

type UserRole = "super_user" | "admin" | "operator" | "client";

type AppointmentData = {
  id: string;
  userId: string | null;
  serviceId: string | null;
  operatorId: string | null;
  appointmentDate: Date;
  status: string;
  notes: string | null;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  } | null;
  operator: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
};

interface AppointmentsTabProps {
  currentUserRole: UserRole;
  currentUserId: string;
}

const statusMap: Record<string, { label: string; bg: string; text: string; border: string; glow: string; icon: React.ElementType }> = {
  pending: { 
    label: "In Attesa", 
    bg: "bg-amber-500/10 dark:bg-amber-500/5", 
    text: "text-amber-600 dark:text-amber-400", 
    border: "border-amber-500/20 dark:border-amber-500/10",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    icon: AlertCircle 
  },
  confirmed: { 
    label: "Confermato", 
    bg: "bg-blue-500/10 dark:bg-blue-500/5", 
    text: "text-blue-600 dark:text-blue-400", 
    border: "border-blue-500/20 dark:border-blue-500/10",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]",
    icon: CheckCircle2 
  },
  completed: { 
    label: "Completato", 
    bg: "bg-emerald-500/10 dark:bg-emerald-500/5", 
    text: "text-emerald-600 dark:text-emerald-400", 
    border: "border-emerald-500/20 dark:border-emerald-500/10",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    icon: CheckCircle2 
  },
  cancelled: { 
    label: "Cancellato", 
    bg: "bg-rose-500/10 dark:bg-rose-500/5", 
    text: "text-rose-600 dark:text-rose-400", 
    border: "border-rose-500/20 dark:border-rose-500/10",
    glow: "shadow-[0_0_15px_rgba(244,63,94,0.1)]",
    icon: XCircle 
  },
};

export function AppointmentsTab({ currentUserRole, currentUserId }: AppointmentsTabProps) {
  const isAdmin = currentUserRole === "admin" || currentUserRole === "super_user";

  // --- Filters State ---
  const todayStr = new Date().toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState<string>(todayStr); // Default to today
  const [dateTo, setDateTo] = useState<string>(todayStr);     // Default to today
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [operatorIdFilter, setOperatorIdFilter] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  // --- Data State ---
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  const [operators, setOperators] = useState<{id: string; name: string | null; email: string}[]>([]);

  // --- Detail Dialog State ---
  const [selectedAppt, setSelectedAppt] = useState<AppointmentData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAppointmentsAction({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
        statuses: statusFilter !== "all" ? [statusFilter as AppointmentStatus] : undefined,
        operatorId: isAdmin ? operatorIdFilter : undefined,
        page,
        limit
      });
      setAppointments(res.data as unknown as AppointmentData[]);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      toast.error(err.message || "Errore nel caricamento appuntamenti");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, search, statusFilter, operatorIdFilter, page, isAdmin]);

  const loadOperators = useCallback(async () => {
    if (isAdmin) {
      try {
        const ops = await getOperatorsAction();
        setOperators(ops);
      } catch (e) {
        console.error(e);
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    loadOperators();
  }, [loadOperators]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Handle direct inline status updates (no modal needed)
  const handleDirectUpdateStatus = async (apptId: string, newStatus: AppointmentStatus, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setActionLoadingId(apptId);
    try {
      await updateAppointmentStatusAction(apptId, newStatus);
      toast.success(`Appuntamento ${newStatus === "confirmed" ? "confermato" : newStatus === "completed" ? "completato" : "cancellato"} con successo!`);
      
      // Update local state if the appointment detail is currently open
      if (selectedAppt && selectedAppt.id === apptId) {
        setSelectedAppt(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message || "Errore nell'aggiornamento dello stato");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateStatus = async (newStatus: AppointmentStatus) => {
    if (!selectedAppt) return;
    setIsUpdating(true);
    try {
      await updateAppointmentStatusAction(selectedAppt.id, newStatus);
      toast.success("Stato aggiornato con successo");
      setSelectedAppt((prev) => prev ? { 
        ...prev, 
        status: newStatus 
      } : null);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message || "Errore nell'aggiornamento");
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to compute date boundaries
  const getPresetDates = (preset: "today" | "tomorrow" | "week" | "month" | "all") => {
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    switch (preset) {
      case "today":
        return { from: formatDate(now), to: formatDate(now) };
      case "tomorrow": {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        return { from: formatDate(tomorrow), to: formatDate(tomorrow) };
      }
      case "week": {
        const currentDay = now.getDay();
        const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + distanceToMonday);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return { from: formatDate(startOfWeek), to: formatDate(endOfWeek) };
      }
      case "month": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { from: formatDate(startOfMonth), to: formatDate(endOfMonth) };
      }
      case "all":
      default:
        return { from: "", to: "" };
    }
  };

  const applyPreset = (preset: "today" | "tomorrow" | "week" | "month" | "all") => {
    const { from, to } = getPresetDates(preset);
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
  };

  // --- Dynamic Stats calculation for visual display ---
  const stats = (() => {
    const confirmedCount = appointments.filter(a => a.status === "confirmed").length;
    const completedCount = appointments.filter(a => a.status === "completed").length;
    const pendingCount = appointments.filter(a => a.status === "pending").length;
    const cancelledCount = appointments.filter(a => a.status === "cancelled").length;

    const confirmedRevenue = appointments
      .filter(a => a.status === "confirmed" || a.status === "completed")
      .reduce((sum, a) => sum + (a.service?.price || 0), 0) / 100;

    const pendingRevenue = appointments
      .filter(a => a.status === "pending")
      .reduce((sum, a) => sum + (a.service?.price || 0), 0) / 100;

    const totalMinutes = appointments
      .filter(a => a.status !== "cancelled")
      .reduce((sum, a) => sum + (a.service?.duration || 0), 0);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const formattedDuration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

    const totalCalculated = confirmedCount + completedCount + pendingCount + cancelledCount;
    const successRate = totalCalculated > 0 
      ? Math.round(((completedCount + confirmedCount) / totalCalculated) * 100) 
      : 100;

    return {
      confirmedRevenue,
      pendingRevenue,
      formattedDuration,
      successRate,
      confirmedCount,
      completedCount,
      pendingCount,
      cancelledCount,
    };
  })();

  const activeFiltersCount = [
    dateFrom !== todayStr,
    dateTo !== todayStr,
    statusFilter !== "all",
    search !== "",
    isAdmin && operatorIdFilter !== "all"
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      
      {/* ------------------------------------------------------------------ */}
      {/* Dashboard Live Stats Cards                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
        
        {/* Card 1: Estimated Shift Revenue */}
        <div className="glass-effect relative overflow-hidden group p-5 rounded-2xl border border-brand/10 bg-card/40 backdrop-blur-md transition-all duration-300 hover:shadow-[0_8px_30px_rgba(221,24,59,0.08)] hover:-translate-y-0.5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs uppercase font-extrabold tracking-widest text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" /> Incassi StimatI
              </span>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-3xl font-black tracking-tight text-foreground">€{stats.confirmedRevenue.toFixed(2)}</h3>
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <span className="text-amber-500">€{stats.pendingRevenue.toFixed(2)}</span> in attesa di conferma
              </p>
            </div>
            <div className="p-3 bg-brand/10 text-brand rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-[0_4px_12px_rgba(221,24,59,0.1)]">
              <Euro className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 2: Combined Service Minutes */}
        <div className="glass-effect relative overflow-hidden group p-5 rounded-2xl border border-brand/10 bg-card/40 backdrop-blur-md transition-all duration-300 hover:shadow-[0_8px_30px_rgba(221,24,59,0.08)] hover:-translate-y-0.5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs uppercase font-extrabold tracking-widest text-muted-foreground flex items-center gap-1">
                <Hourglass className="w-3.5 h-3.5 text-blue-500" /> Ore di Servizio
              </span>
              <h3 className="text-3xl font-black tracking-tight text-foreground">{stats.formattedDuration}</h3>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Esclusi appuntamenti cancellati
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-[0_4px_12px_rgba(59,130,246,0.1)]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 3: Success / Confirmation Rate */}
        <div className="glass-effect relative overflow-hidden group p-5 rounded-2xl border border-brand/10 bg-card/40 backdrop-blur-md transition-all duration-300 hover:shadow-[0_8px_30px_rgba(221,24,59,0.08)] hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs uppercase font-extrabold tracking-widest text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Tasso di Successo
              </span>
              <h3 className="text-3xl font-black tracking-tight text-foreground">{stats.successRate}%</h3>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground">
                <span className="text-emerald-500">{stats.completedCount + stats.confirmedCount} OK</span>
                <span className="text-slate-400">|</span>
                <span className="text-amber-500">{stats.pendingCount} ATT</span>
                <span className="text-slate-400">|</span>
                <span className="text-rose-500">{stats.cancelledCount} CANC</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-[0_4px_12px_rgba(16,185,129,0.1)]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Header & Advanced Filters Card                                     */}
      {/* ------------------------------------------------------------------ */}
      <Card className="glass-effect border-brand/10 shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="border-b border-brand/10 bg-brand/5 p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-foreground">
                <CalendarIcon className="w-5 h-5 text-brand" />
                Planning Appuntamenti
                <span className="ml-2 bg-brand hover:bg-brand-hover text-white text-xs px-2.5 py-0.5 rounded-full font-extrabold shadow-sm transition-colors duration-200">
                  {total}
                </span>
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm mt-0.5">
                {isAdmin ? "Pannello di controllo e coordinazione del salone." : "Filtro dei tuoi appuntamenti assegnati."}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2.5 justify-between md:justify-end w-full md:w-auto shrink-0">
              <Button 
                aria-label="Filtra gli appuntamenti"
                variant="outline" 
                size="sm" 
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="md:hidden border-brand/20 text-brand bg-brand/5 hover:bg-brand/15 font-bold h-9 px-4 rounded-xl"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtri {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Button>

              <Button 
                aria-label="Aggiorna l'elenco degli appuntamenti"
                variant="outline" 
                size="sm" 
                onClick={fetchAppointments}
                disabled={loading}
                className="border-brand/20 text-brand bg-brand/5 hover:bg-brand/15 font-bold h-9 px-4 rounded-xl shrink-0"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className={`p-5 sm:p-6 space-y-5 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
          
          {/* Quick Date Presets Row */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface/40 dark:bg-surface/10 rounded-2xl border border-brand/5 w-fit select-none">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3 py-1">Scelte Rapide:</span>
            <button
              onClick={() => applyPreset("today")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                dateFrom === todayStr && dateTo === todayStr
                  ? "bg-brand text-white shadow-sm scale-102"
                  : "text-muted-foreground hover:text-brand hover:bg-brand/5"
              }`}
            >
              Oggi
            </button>
            <button
              onClick={() => applyPreset("tomorrow")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                dateFrom === getPresetDates("tomorrow").from && dateTo === getPresetDates("tomorrow").to
                  ? "bg-brand text-white shadow-sm scale-102"
                  : "text-muted-foreground hover:text-brand hover:bg-brand/5"
              }`}
            >
              Domani
            </button>
            <button
              onClick={() => applyPreset("week")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                dateFrom === getPresetDates("week").from && dateTo === getPresetDates("week").to
                  ? "bg-brand text-white shadow-sm scale-102"
                  : "text-muted-foreground hover:text-brand hover:bg-brand/5"
              }`}
            >
              Questa Settimana
            </button>
            <button
              onClick={() => applyPreset("month")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                dateFrom === getPresetDates("month").from && dateTo === getPresetDates("month").to
                  ? "bg-brand text-white shadow-sm scale-102"
                  : "text-muted-foreground hover:text-brand hover:bg-brand/5"
              }`}
            >
              Questo Mese
            </button>
            <button
              onClick={() => applyPreset("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                dateFrom === "" && dateTo === ""
                  ? "bg-brand text-white shadow-sm scale-102"
                  : "text-muted-foreground hover:text-brand hover:bg-brand/5"
              }`}
            >
              Tutto
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Date Range Inputs */}
            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <CalendarDays className="w-3 h-3 text-brand" /> Intervallo Date
              </Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="date" 
                  aria-label="Data inizio intervallo"
                  value={dateFrom} 
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="bg-background/40 hover:bg-background/60 focus:bg-background h-10 rounded-xl border-brand/10 transition-colors"
                />
                <span className="text-muted-foreground text-xs font-bold px-1">al</span>
                <Input 
                  type="date" 
                  aria-label="Data fine intervallo"
                  value={dateTo} 
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="bg-background/40 hover:bg-background/60 focus:bg-background h-10 rounded-xl border-brand/10 transition-colors"
                />
              </div>
            </div>

            {/* Status Selector */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Filter className="w-3 h-3 text-brand" /> Stato Appuntamento
              </Label>
              <div className="relative">
                <select
                  aria-label="Seleziona stato da filtrare"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="appearance-none flex h-10 w-full rounded-xl border border-brand/10 bg-background/40 hover:bg-background/60 px-3.5 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all pr-8"
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="pending">In Attesa</option>
                  <option value="confirmed">Confermato</option>
                  <option value="completed">Completato</option>
                  <option value="cancelled">Cancellato</option>
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none opacity-60" />
              </div>
            </div>

            {/* Search Input */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Search className="w-3 h-3 text-brand" /> Cerca Cliente
              </Label>
              <div className="relative">
                <Input
                  placeholder="Nome o email cliente..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="bg-background/40 hover:bg-background/60 focus:bg-background h-10 rounded-xl border-brand/10 pl-9 transition-colors"
                />
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none opacity-50" />
              </div>
            </div>

            {/* Operator Filter (Admins Only) */}
            {isAdmin && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-brand" /> Operatore
                </Label>
                <div className="relative">
                  <select
                    aria-label="Filtra per operatore"
                    value={operatorIdFilter}
                    onChange={(e) => { setOperatorIdFilter(e.target.value); setPage(1); }}
                    className="appearance-none flex h-10 w-full rounded-xl border border-brand/10 bg-background/40 hover:bg-background/60 px-3.5 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all pr-8"
                  >
                    <option value="all">Tutti gli operatori</option>
                    {operators.map(op => (
                      <option key={op.id} value={op.id}>{op.name || op.email}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none opacity-60" />
                </div>
              </div>
            )}
            
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Appointments List / Table                                           */}
      {/* ------------------------------------------------------------------ */}
      <Card className="glass-effect border-brand/10 overflow-hidden shadow-xl rounded-2xl">
        
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand/5 text-[10px] uppercase tracking-widest font-black text-muted-foreground border-b border-brand/10">
                <th className="p-4 pl-6 whitespace-nowrap">Data e Ora</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Servizio</th>
                {isAdmin && <th className="p-4">Operatore</th>}
                <th className="p-4 text-center">Stato</th>
                <th className="p-4 pr-6 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand/10 bg-card/10">
              <AnimatePresence mode="popLayout">
                {loading && appointments.length === 0 ? (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={isAdmin ? 6 : 5} className="p-12 text-center text-muted-foreground">
                      <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-brand" />
                      <p className="text-sm font-semibold">Caricamento appuntamenti in corso...</p>
                    </td>
                  </motion.tr>
                ) : appointments.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={isAdmin ? 6 : 5} className="p-16 text-center text-muted-foreground">
                      <div className="w-14 h-14 bg-brand/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand/10">
                        <CalendarIcon className="w-6 h-6 text-brand opacity-60" />
                      </div>
                      <p className="text-base font-bold text-foreground">Nessun appuntamento trovato</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">Non sono presenti prenotazioni per i filtri selezionati. Prova a modificare le date o a resettare i filtri.</p>
                      <Button 
                        aria-label="Resetta filtri di ricerca"
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setDateFrom(""); setDateTo(""); setStatusFilter("all"); setSearch(""); setOperatorIdFilter("all"); setPage(1);
                        }}
                        className="border-brand/20 text-brand bg-brand/5 hover:bg-brand/15 font-bold rounded-xl mt-4"
                      >
                        Resetta Filtri
                      </Button>
                    </td>
                  </motion.tr>
                ) : (
                  appointments.map((appt, idx) => {
                    const statusInfo = statusMap[appt.status] || statusMap.pending;
                    const StatusIcon = statusInfo.icon;
                    const isRowUpdating = actionLoadingId === appt.id;
                    const dateObj = new Date(appt.appointmentDate);
                    
                    return (
                      <motion.tr 
                        key={appt.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        onClick={() => setSelectedAppt(appt)}
                        className={`hover:bg-brand/5 dark:hover:bg-brand/10 transition-all cursor-pointer group/row relative ${isRowUpdating ? 'opacity-55 pointer-events-none' : ''}`}
                      >
                        {/* Date & Time */}
                        <td className="p-4 pl-6 font-medium whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand/5 flex flex-col items-center justify-center border border-brand/10 shrink-0 shadow-sm">
                              <span className="text-[9px] font-black text-brand uppercase leading-none">
                                {new Intl.DateTimeFormat("it-IT", { month: "short" }).format(dateObj)}
                              </span>
                              <span className="text-sm font-black leading-none mt-0.5">
                                {new Intl.DateTimeFormat("it-IT", { day: "2-digit" }).format(dateObj)}
                              </span>
                            </div>
                            <div>
                              <div className="font-extrabold text-sm text-foreground">
                                {new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(dateObj)}
                              </div>
                              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                                {new Intl.DateTimeFormat("it-IT", { weekday: "short", year: "numeric" }).format(dateObj)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="p-4">
                          <div className="font-extrabold text-sm text-foreground">{appt.user?.name || "Cliente Sconosciuto"}</div>
                          <div className="text-xs text-muted-foreground font-medium truncate max-w-[170px] mt-0.5">{appt.user?.email}</div>
                        </td>

                        {/* Service */}
                        <td className="p-4">
                          <div className="font-bold text-sm text-foreground">{appt.service?.name || "Servizio rimosso"}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-brand" /> {appt.service?.duration || 0} min
                          </div>
                        </td>

                        {/* Operator (Admin View) */}
                        {isAdmin && (
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                                <User className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-sm font-bold text-foreground/80 truncate max-w-[130px]" title={appt.operator?.name || appt.operator?.email}>
                                {appt.operator?.name || appt.operator?.email || "Non Assegnato"}
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Status Badge */}
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border} ${statusInfo.glow}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Inline controls & Detailed Actions */}
                        <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            
                            {/* Hover Quick Actions for Admins */}
                            {isAdmin && (
                              <div className="hidden lg:flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 mr-2 bg-surface/90 dark:bg-surface/30 p-1 border border-brand/10 rounded-xl shadow-sm">
                                {appt.status === "pending" && (
                                  <Button
                                    aria-label="Conferma appuntamento"
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => handleDirectUpdateStatus(appt.id, "confirmed", e)}
                                    className="w-7 h-7 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                                    title="Conferma"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {(appt.status === "pending" || appt.status === "confirmed") && (
                                  <Button
                                    aria-label="Completa appuntamento"
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => handleDirectUpdateStatus(appt.id, "completed", e)}
                                    className="w-7 h-7 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                                    title="Completa"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {appt.status !== "cancelled" && (
                                  <Button
                                    aria-label="Cancella appuntamento"
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => handleDirectUpdateStatus(appt.id, "cancelled", e)}
                                    className="w-7 h-7 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                    title="Cancella"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            )}

                            <Button
                              aria-label="Visualizza dettagli"
                              size="icon"
                              variant="ghost"
                              className="text-brand hover:bg-brand hover:text-white rounded-xl shadow-sm transition-all h-8 w-8"
                              onClick={() => setSelectedAppt(appt)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>

                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="block md:hidden divide-y divide-brand/10 bg-card/10">
          <AnimatePresence mode="popLayout">
            {loading && appointments.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 text-center text-muted-foreground"
              >
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
                <p className="text-sm font-semibold">Caricamento appuntamenti...</p>
              </motion.div>
            ) : appointments.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 text-center text-muted-foreground"
              >
                <div className="w-12 h-12 bg-brand/5 rounded-full flex items-center justify-center mx-auto mb-3 border border-brand/10">
                  <CalendarIcon className="w-5 h-5 text-brand opacity-60" />
                </div>
                <p className="text-sm font-bold text-foreground">Nessun appuntamento trovato</p>
                <p className="text-xs text-muted-foreground mt-1 px-4">Prova a modificare i filtri o le date di ricerca.</p>
                <Button 
                  aria-label="Resetta filtri di ricerca"
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setDateFrom(""); setDateTo(""); setStatusFilter("all"); setSearch(""); setOperatorIdFilter("all"); setPage(1);
                  }}
                  className="border-brand/20 text-brand bg-brand/5 hover:bg-brand/15 font-bold rounded-xl mt-3 text-xs"
                >
                  Resetta Filtri
                </Button>
              </motion.div>
            ) : (
              appointments.map((appt, idx) => {
                const statusInfo = statusMap[appt.status] || statusMap.pending;
                const StatusIcon = statusInfo.icon;
                const dateObj = new Date(appt.appointmentDate);
                const isRowUpdating = actionLoadingId === appt.id;
                
                return (
                  <motion.div 
                    key={appt.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    className={`p-4 hover:bg-brand/5 transition-colors cursor-pointer relative ${isRowUpdating ? 'opacity-55 pointer-events-none' : ''}`}
                    onClick={() => setSelectedAppt(appt)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Date Stub & Customer Meta */}
                      <div className="flex gap-3 min-w-0">
                        
                        {/* Visual Date Square */}
                        <div className="w-10 h-10 rounded-xl bg-brand/5 flex flex-col items-center justify-center border border-brand/10 shrink-0 shadow-sm">
                          <span className="text-[8px] font-black text-brand uppercase leading-none">
                            {new Intl.DateTimeFormat("it-IT", { month: "short" }).format(dateObj)}
                          </span>
                          <span className="text-sm font-black leading-none mt-0.5">
                            {new Intl.DateTimeFormat("it-IT", { day: "2-digit" }).format(dateObj)}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-black text-brand tracking-wide">
                            {new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(dateObj)}
                          </div>
                          <div className="font-extrabold text-sm mt-0.5 text-foreground truncate max-w-[170px]">
                            {appt.user?.name || "Cliente Sconosciuto"}
                          </div>
                        </div>

                      </div>

                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border shrink-0 ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Middle Info Block: Service details & assigned operator */}
                    <div className="mt-3 bg-brand/5 dark:bg-brand/10 border border-brand/10 rounded-xl p-2.5 flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-foreground">{appt.service?.name || "Servizio rimosso"}</span>
                        <span className="text-brand">€{appt.service ? (appt.service.price / 100).toFixed(2) : "-"}</span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-brand" /> {appt.service?.duration || 0} min</span>
                        {isAdmin && appt.operator && (
                          <span className="flex items-center gap-1.5 truncate max-w-[180px]">
                            <User className="w-3.5 h-3.5 text-brand" />
                            <span>Op: <strong className="text-foreground/80 font-bold">{appt.operator.name || appt.operator.email}</strong></span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Row: Timestamps & Details Trigger */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground font-semibold">
                        Registrato: {new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(appt.createdAt))}
                      </span>
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        
                        {/* Quick Mobile Action Buttons for Admin */}
                        {isAdmin && appt.status === "pending" && (
                          <Button
                            aria-label="Conferma appuntamento rapido"
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleDirectUpdateStatus(appt.id, "confirmed", e)}
                            className="border-blue-200 text-blue-700 bg-blue-500/5 hover:bg-blue-500/10 text-[10px] py-1 h-7 rounded-lg font-bold"
                          >
                            Conferma
                          </Button>
                        )}

                        <Button
                          aria-label="Apri scheda appuntamento"
                          size="sm"
                          variant="outline"
                          className="border-brand/20 text-brand bg-brand/5 hover:bg-brand/10 text-xs py-1 h-8 rounded-lg font-bold"
                          onClick={() => setSelectedAppt(appt)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Scheda
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
        
        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-brand/10 bg-surface/20 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
              Pagina {page} di {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                aria-label="Vai alla pagina precedente"
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="h-8 rounded-lg border-brand/20 bg-brand/5 hover:bg-brand/15 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                aria-label="Vai alla pagina successiva"
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="h-8 rounded-lg border-brand/20 bg-brand/5 hover:bg-brand/15 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Dynamic Receipt Ticket Detail Dialog                               */}
      {/* ------------------------------------------------------------------ */}
      <Dialog 
        open={!!selectedAppt} 
        onOpenChange={(open) => !open && setSelectedAppt(null)}
      >
        <DialogContent className="max-w-md sm:rounded-[2.5rem] border-brand/20 shadow-2xl overflow-hidden p-0 gap-0 bg-background/95 backdrop-blur-xl transition-all duration-300">
          {selectedAppt && (() => {
            const statusInfo = statusMap[selectedAppt.status] || statusMap.pending;
            const StatusIcon = statusInfo.icon;
            const apptDate = new Date(selectedAppt.appointmentDate);

            return (
              <div className="flex flex-col h-full bg-noise">
                
                {/* Header Stub */}
                <div className="p-6 pb-4 bg-surface/80 dark:bg-surface/20 border-b border-brand/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-brand/5 rounded-full blur-[40px] -mr-12 -mt-12 pointer-events-none" />
                  <DialogHeader>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase border shadow-sm ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border} ${statusInfo.glow}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusInfo.label}
                      </span>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-brand/5 px-2.5 py-1 rounded-lg border border-brand/5">
                        ID: #{selectedAppt.id.split("-")[0].toUpperCase()}
                      </span>
                    </div>
                    <DialogTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-5 h-5 text-brand" /> Scheda Prenotazione
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium text-xs">
                      Visualizza e modifica i dettagli della prenotazione del cliente.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                {/* Main Receipt Body */}
                <div className="p-6 space-y-6">
                  
                  {/* Visual Premium Barber Shop Ticket Container */}
                  <div className="relative bg-card/65 backdrop-blur-md rounded-2xl border border-brand/10 p-5 overflow-hidden shadow-md">
                    {/* Retro Ticket Decorative Holes */}
                    <div className="absolute top-[37%] -left-3.5 w-7 h-7 bg-background dark:bg-background rounded-full border border-brand/10 -translate-y-1/2 z-10 shadow-[inset_-3px_0_5px_rgba(0,0,0,0.02)]" />
                    <div className="absolute top-[37%] -right-3.5 w-7 h-7 bg-background dark:bg-background rounded-full border border-brand/10 -translate-y-1/2 z-10 shadow-[inset_3px_0_5px_rgba(0,0,0,0.02)]" />

                    {/* UPPER TICKET: Primary Schedule Info */}
                    <div className="grid grid-cols-2 gap-4 pb-4">
                      
                      <div className="bg-brand/5 rounded-xl p-3 border border-brand/10">
                        <div className="text-[9px] font-black text-brand uppercase tracking-wider mb-1 flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-brand" /> DATA & ORA
                        </div>
                        <div className="font-black text-sm text-foreground">
                          {new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "long" }).format(apptDate)}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-bold mt-0.5">
                          Ore {new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(apptDate)}
                        </div>
                      </div>

                      <div className="bg-brand/5 rounded-xl p-3 border border-brand/10">
                        <div className="text-[9px] font-black text-brand uppercase tracking-wider mb-1 flex items-center gap-1">
                          <User className="w-3 h-3 text-brand" /> CLIENTE
                        </div>
                        <div className="font-black text-sm text-foreground truncate" title={selectedAppt.user?.name || "Sconosciuto"}>
                          {selectedAppt.user?.name || "Sconosciuto"}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5" title={selectedAppt.user?.email}>
                          {selectedAppt.user?.email}
                        </div>
                      </div>

                    </div>

                    {/* Ticket Separator (Dashed with notches alignment) */}
                    <div className="border-t-2 border-dashed border-brand/10 my-1 relative" />

                    {/* LOWER TICKET: Service & Price details */}
                    <div className="pt-4 space-y-4">
                      
                      <div>
                        <h4 className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1"><ClipboardList className="w-3 h-3 text-brand" /> DETTAGLIO SERVIZIO</h4>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-brand/10 bg-surface/50">
                          <div className="font-bold text-sm text-foreground">{selectedAppt.service?.name || "Non disponibile"}</div>
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-brand">
                              {selectedAppt.service ? `€${(selectedAppt.service.price / 100).toFixed(2)}` : "-"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-0.5">
                              <Clock className="w-3 h-3 text-brand" /> {selectedAppt.service?.duration || 0} min
                            </span>
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <div>
                          <h4 className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1"><UserCheck className="w-3 h-3 text-brand" /> OPERATORE ASSEGNATO</h4>
                          <div className="flex items-center gap-3 p-3 rounded-xl border border-brand/10 bg-surface/50">
                            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                              <UserCheck className="w-4.5 h-4.5 text-brand" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-foreground truncate">{selectedAppt.operator?.name || "Non assegnato"}</div>
                              <div className="text-[10px] text-muted-foreground font-medium truncate">{selectedAppt.operator?.email}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedAppt.notes && (
                        <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs italic shadow-sm">
                          <strong className="block font-black text-[9px] uppercase tracking-wider not-italic text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> NOTA CLIENTE</strong>
                          "{selectedAppt.notes}"
                        </div>
                      )}

                    </div>

                  </div>
                </div>

                {/* Footer and Management Controls */}
                <div className="p-6 pt-0 bg-background/50 border-t border-brand/5 mt-auto">
                  {isAdmin && (
                    <div className="py-5">
                      <h4 className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        Azioni Amministrative <span className="h-px flex-1 bg-brand/10" />
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          aria-label="Conferma prenotazione"
                          size="sm"
                          variant="outline" 
                          onClick={() => handleUpdateStatus("confirmed")}
                          disabled={isUpdating || selectedAppt.status === "confirmed"}
                          className="border-blue-200 text-blue-700 bg-blue-500/5 hover:bg-blue-500/10 dark:border-blue-900/30 dark:text-blue-400 rounded-xl font-bold h-9 text-xs transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Conferma
                        </Button>
                        <Button 
                          aria-label="Segna appuntamento come completato"
                          size="sm"
                          variant="outline" 
                          onClick={() => handleUpdateStatus("completed")}
                          disabled={isUpdating || selectedAppt.status === "completed"}
                          className="border-emerald-200 text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 dark:border-emerald-900/30 dark:text-emerald-400 rounded-xl font-bold h-9 text-xs transition-colors"
                        >
                          <Check className="w-4 h-4 mr-2" /> Completa
                        </Button>
                        <Button 
                          aria-label="Annulla appuntamento"
                          size="sm"
                          variant="outline" 
                          onClick={() => handleUpdateStatus("cancelled")}
                          disabled={isUpdating || selectedAppt.status === "cancelled"}
                          className="col-span-2 border-rose-200 text-rose-700 bg-rose-500/5 hover:bg-rose-500/10 dark:border-rose-900/30 dark:text-rose-400 rounded-xl font-bold h-9 text-xs transition-colors"
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Cancella Appuntamento
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <DialogFooter className="sm:justify-end gap-2">
                    <Button 
                      aria-label="Chiudi popup"
                      type="button" 
                      variant="ghost" 
                      onClick={() => setSelectedAppt(null)}
                      className="hover:bg-brand/10 font-bold rounded-xl h-9 text-xs"
                    >
                      Chiudi
                    </Button>
                  </DialogFooter>
                </div>

              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
