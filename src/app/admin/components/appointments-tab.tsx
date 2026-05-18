"use client";

import { useState, useEffect, useCallback } from "react";
// Native JS Dates will be used
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
  UserCheck
} from "lucide-react";

type UserRole = "super_user" | "admin" | "operator" | "client";

// Define the shape of our appointment data from the action
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

const statusMap: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "In Attesa", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: AlertCircle },
  confirmed: { label: "Confermato", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2 },
  completed: { label: "Completato", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  cancelled: { label: "Cancellato", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
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

  // Handle filter changes (reset page)
  const handleFilterChange = () => {
    setPage(1);
    fetchAppointments();
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

  const activeFiltersCount = [
    dateFrom !== todayStr,
    dateTo !== todayStr,
    statusFilter !== "all",
    search !== "",
    isAdmin && operatorIdFilter !== "all"
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Filters */}
      <Card className="glass-effect border-brand/10">
        <CardHeader className="border-b border-brand/10 bg-brand/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-brand" />
                Appuntamenti
                <span className="ml-2 bg-brand text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {total}
                </span>
              </CardTitle>
              <CardDescription>
                {isAdmin ? "Gestisci tutti gli appuntamenti del salone." : "Visualizza i tuoi appuntamenti assegnati."}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 justify-between md:justify-end w-full md:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="md:hidden border-brand/20 text-brand hover:bg-brand/10"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtri {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAppointments}
                disabled={loading}
                className="border-brand/20 text-brand hover:bg-brand/10 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={`p-4 sm:p-6 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Date Range */}
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-xs font-bold text-muted uppercase tracking-wider">Intervallo Date</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="date" 
                  value={dateFrom} 
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="bg-background/50 h-10"
                />
                <span className="text-muted">-</span>
                <Input 
                  type="date" 
                  value={dateTo} 
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="bg-background/50 h-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3" /> Stato
              </Label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="flex h-10 w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <option value="all">Tutti gli stati</option>
                <option value="pending">In Attesa</option>
                <option value="confirmed">Confermato</option>
                <option value="completed">Completato</option>
                <option value="cancelled">Cancellato</option>
              </select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                <Search className="w-3 h-3" /> Cliente
              </Label>
              <Input
                placeholder="Nome o email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="bg-background/50 h-10 rounded-xl"
              />
            </div>

            {/* Operator Filter (Admins Only) */}
            {isAdmin && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Operatore
                </Label>
                <select
                  value={operatorIdFilter}
                  onChange={(e) => { setOperatorIdFilter(e.target.value); setPage(1); }}
                  className="flex h-10 w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <option value="all">Tutti gli operatori</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>{op.name || op.email}</option>
                  ))}
                </select>
              </div>
            )}
            
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="glass-effect border-brand/10 overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand/5 text-[10px] uppercase tracking-widest font-bold text-muted border-b border-brand/10">
                <th className="p-4 whitespace-nowrap">Data e Ora</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Servizio</th>
                {isAdmin && <th className="p-4">Operatore</th>}
                <th className="p-4 text-center">Stato</th>
                <th className="p-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand/10">
              {loading && appointments.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-muted">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
                    Caricamento appuntamenti...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-muted">
                    <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>Nessun appuntamento trovato per i filtri selezionati.</p>
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setDateFrom(""); setDateTo(""); setStatusFilter("all"); setSearch(""); setOperatorIdFilter("all"); setPage(1);
                      }}
                      className="text-brand mt-2"
                    >
                      Resetta Filtri
                    </Button>
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => {
                  const statusInfo = statusMap[appt.status] || statusMap.pending;
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr 
                      key={appt.id} 
                      className="hover:bg-brand/5 transition-colors cursor-pointer group"
                      onClick={() => setSelectedAppt(appt)}
                    >
                      <td className="p-4 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-surface flex flex-col items-center justify-center border border-brand/10">
                            <span className="text-[10px] font-bold text-brand uppercase leading-none">
                              {new Intl.DateTimeFormat("it-IT", { month: "short" }).format(new Date(appt.appointmentDate))}
                            </span>
                            <span className="text-sm font-black leading-none">
                              {new Intl.DateTimeFormat("it-IT", { day: "2-digit" }).format(new Date(appt.appointmentDate))}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-sm">
                              {new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(new Date(appt.appointmentDate))}
                            </div>
                            <div className="text-[10px] text-muted">
                              {new Intl.DateTimeFormat("it-IT", { year: "numeric" }).format(new Date(appt.appointmentDate))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-sm">{appt.user?.name || "Cliente Sconosciuto"}</div>
                        <div className="text-xs text-muted truncate max-w-[150px]">{appt.user?.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-sm">{appt.service?.name || "Servizio rimosso"}</div>
                        <div className="flex items-center gap-1 text-xs text-muted mt-0.5">
                          <Clock className="w-3 h-3" /> {appt.service?.duration || 0} min
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                              <User className="w-3 h-3" />
                            </div>
                            <span className="text-sm font-medium">{appt.operator?.name || appt.operator?.email || "N/D"}</span>
                          </div>
                        </td>
                      )}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-brand hover:bg-brand hover:text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppt(appt);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="block md:hidden divide-y divide-brand/10">
          {loading && appointments.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
              Caricamento appuntamenti...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>Nessun appuntamento trovato per i filtri selezionati.</p>
              <Button 
                variant="link" 
                onClick={() => {
                  setDateFrom(""); setDateTo(""); setStatusFilter("all"); setSearch(""); setOperatorIdFilter("all"); setPage(1);
                }}
                className="text-brand mt-2"
              >
                Resetta Filtri
              </Button>
            </div>
          ) : (
            appointments.map((appt) => {
              const statusInfo = statusMap[appt.status] || statusMap.pending;
              const StatusIcon = statusInfo.icon;
              const dateObj = new Date(appt.appointmentDate);
              
              return (
                <div 
                  key={appt.id} 
                  className="p-4 hover:bg-brand/5 transition-colors cursor-pointer"
                  onClick={() => setSelectedAppt(appt)}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Date Block & Client Details */}
                    <div className="flex gap-3">
                      {/* Left: Date Block */}
                      <div className="w-11 h-11 rounded-xl bg-brand/5 flex flex-col items-center justify-center border border-brand/10 shrink-0">
                        <span className="text-[9px] font-bold text-brand uppercase leading-none mb-0.5">
                          {new Intl.DateTimeFormat("it-IT", { month: "short" }).format(dateObj)}
                        </span>
                        <span className="text-base font-black leading-none">
                          {new Intl.DateTimeFormat("it-IT", { day: "2-digit" }).format(dateObj)}
                        </span>
                      </div>

                      {/* Right: Client and Date Meta */}
                      <div>
                        <div className="text-xs font-semibold text-brand">
                          {new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(dateObj)}
                        </div>
                        <div className="font-bold text-sm mt-0.5 text-foreground">
                          {appt.user?.name || "Cliente Sconosciuto"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
                          {appt.user?.email}
                        </div>
                      </div>
                    </div>

                    {/* Right: Status badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shrink-0 ${statusInfo.color}`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Middle Row: Service information & Operator */}
                  <div className="mt-3 bg-brand/5 border border-brand/10 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-foreground">{appt.service?.name || "Servizio rimosso"}</span>
                      <span className="text-muted-foreground ml-1">({appt.service?.duration || 0} min)</span>
                    </div>

                    {isAdmin && appt.operator && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="w-3.5 h-3.5 text-brand" />
                        <span>Op: <strong className="text-foreground">{appt.operator.name || appt.operator.email}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Actions Trigger */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Creato il {new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(appt.createdAt))}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-brand/20 text-brand hover:bg-brand hover:text-white text-xs py-1 h-8 rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppt(appt);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Dettagli
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-brand/10 bg-surface/50 flex items-center justify-between">
            <span className="text-xs text-muted font-medium">
              Pagina {page} di {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="h-8 rounded-lg border-brand/20 hover:bg-brand/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="h-8 rounded-lg border-brand/20 hover:bg-brand/10"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Appointment Detail Dialog */}
      <Dialog 
        open={!!selectedAppt} 
        onOpenChange={(open) => !open && setSelectedAppt(null)}
      >
        <DialogContent className="max-w-md sm:rounded-3xl border-brand/20 shadow-2xl overflow-hidden p-0 gap-0 bg-background/95 backdrop-blur-xl">
          {selectedAppt && (() => {
            const statusInfo = statusMap[selectedAppt.status] || statusMap.pending;
            const StatusIcon = statusInfo.icon;
            const apptDate = new Date(selectedAppt.appointmentDate);

            return (
              <>
                <div className="p-6 pb-4 bg-surface border-b border-brand/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
                  <DialogHeader>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border shadow-sm ${statusInfo.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusInfo.label}
                      </span>
                      <span className="text-xs font-bold text-muted">
                        ID: {selectedAppt.id.split("-")[0]}
                      </span>
                    </div>
                    <DialogTitle className="text-2xl tracking-tight">Dettaglio Appuntamento</DialogTitle>
                    <DialogDescription>
                      Visualizza e gestisci i dettagli della prenotazione.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-brand/5 rounded-2xl p-4 border border-brand/10">
                      <div className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" /> Data & Ora
                      </div>
                      <div className="font-bold text-sm">
                        {new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "long", year: "numeric" }).format(apptDate)}
                      </div>
                      <div className="text-xs text-muted font-medium mt-0.5">
                        Ore {new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(apptDate)}
                      </div>
                    </div>

                    <div className="bg-brand/5 rounded-2xl p-4 border border-brand/10">
                      <div className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1 flex items-center gap-1">
                        <User className="w-3 h-3" /> Cliente
                      </div>
                      <div className="font-bold text-sm truncate" title={selectedAppt.user?.name || "Sconosciuto"}>
                        {selectedAppt.user?.name || "Sconosciuto"}
                      </div>
                      <div className="text-xs text-muted truncate" title={selectedAppt.user?.email}>
                        {selectedAppt.user?.email}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Servizio Prenotato</h4>
                      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
                        <div className="font-semibold text-sm">{selectedAppt.service?.name || "Non disponibile"}</div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-brand">
                            {selectedAppt.service ? `€${(selectedAppt.service.price / 100).toFixed(2)}` : "-"}
                          </span>
                          <span className="text-xs text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {selectedAppt.service?.duration || 0} min
                          </span>
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Operatore Assegnato</h4>
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface">
                          <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{selectedAppt.operator?.name || "Non assegnato"}</div>
                            <div className="text-xs text-muted truncate">{selectedAppt.operator?.email}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedAppt.notes && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Note Cliente</h4>
                        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-800 dark:text-yellow-200 text-sm italic">
                          "{selectedAppt.notes}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0 bg-background">
                  {isAdmin && (
                    <div className="mb-6 pt-6 border-t border-border">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
                        Azioni Admin <span className="h-px flex-1 bg-border" />
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm"
                          variant="outline" 
                          onClick={() => handleUpdateStatus("confirmed")}
                          disabled={isUpdating || selectedAppt.status === "confirmed"}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Conferma
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline" 
                          onClick={() => handleUpdateStatus("completed")}
                          disabled={isUpdating || selectedAppt.status === "completed"}
                          className="border-green-200 text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Completa
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline" 
                          onClick={() => handleUpdateStatus("cancelled")}
                          disabled={isUpdating || selectedAppt.status === "cancelled"}
                          className="col-span-2 border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Cancella Appuntamento
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <DialogFooter className="sm:justify-end">
                    <Button type="button" variant="ghost" onClick={() => setSelectedAppt(null)}>
                      Chiudi
                    </Button>
                  </DialogFooter>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
