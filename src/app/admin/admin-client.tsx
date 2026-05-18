"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  upgradeToOperator,
  upgradeToAdmin,
  rollbackToClient,
} from "@/lib/actions/roles";
import {
  deleteUser,
  addService,
  updateService,
  removeService,
  addProduct,
  removeProduct,
} from "@/lib/actions/admin";
import { toast } from "sonner";
import {
  CheckSquare,
  Plus,
  Trash2,
  UserPlus,
  UserMinus,
  ShieldCheck,
  Scissors,
  Edit2,
  ShoppingBag,
  Users,
  AlertTriangle,
  User,
  Star,
  Sparkles,
  Droplet,
  Clock,
  Flame,
  Zap,
  Crown,
  Leaf,
  X,
  CheckCircle2,
  Circle,
  Check,
  Calendar as CalendarIcon,
  Search,
  SlidersHorizontal,
  Lock
} from "lucide-react";
import { AppointmentsTab } from "./components/appointments-tab";

// ---------------------------------------------------------------------------
// Configs
// ---------------------------------------------------------------------------
const availableIcons = [
  { value: "Scissors", label: "Forbici", icon: Scissors },
  { value: "User", label: "Utente", icon: User },
  { value: "Star", label: "Stella", icon: Star },
  { value: "Sparkles", label: "Scintille", icon: Sparkles },
  { value: "Droplet", label: "Goccia", icon: Droplet },
  { value: "Clock", label: "Orologio", icon: Clock },
  { value: "Flame", label: "Fiamma", icon: Flame },
  { value: "Zap", label: "Fulmine", icon: Zap },
  { value: "Crown", label: "Corona", icon: Crown },
  { value: "Leaf", label: "Foglia", icon: Leaf },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UserRole = "super_user" | "admin" | "operator" | "client";

type DashboardUser = {
  id: string;
  clerkId: string;
  name: string | null;
  email: string;
  role: UserRole;
};

type DashboardService = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  icon: string | null;
  category: string | null;
};

type DashboardProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string | null;
};

type ActionType = "promote_operator" | "promote_admin" | "rollback" | "delete";

interface ConfirmDialogState {
  open: boolean;
  action: ActionType | null;
  targetUser: DashboardUser | null;
}

interface AdminDashboardClientProps {
  initialUsers: DashboardUser[];
  initialServices: DashboardService[];
  initialProducts: DashboardProduct[];
  currentUserId?: string | null;
  currentUserRole: UserRole;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Errore durante l'operazione";
}

/** Returns true if the currently logged-in user can SELECT (click) a row. */
function isRowSelectable(
  viewer: UserRole,
  target: DashboardUser,
  currentUserId: string | null | undefined
): boolean {
  if (target.clerkId === currentUserId) return false; // never self

  if (viewer === "super_user") {
    // Can interact with everyone except other super_users
    return target.role !== "super_user";
  }

  if (viewer === "admin") {
    // Can interact only with client and operator
    return target.role === "client" || target.role === "operator";
  }

  return false;
}

/** Returns the set of action buttons the viewer can show for the selected user. */
function getAllowedActions(
  viewer: UserRole,
  target: DashboardUser
): ActionType[] {
  const actions: ActionType[] = [];

  if (viewer === "super_user") {
    if (target.role === "client") {
      actions.push("promote_operator");
      actions.push("promote_admin");
    }
    if (target.role === "operator") {
      actions.push("promote_admin");
      actions.push("rollback");
    }
    if (target.role === "admin") {
      actions.push("rollback");
    }
    actions.push("delete");
  } else if (viewer === "admin") {
    if (target.role === "client") {
      actions.push("promote_operator");
    }
    if (target.role === "operator") {
      actions.push("rollback");
    }
    actions.push("delete");
  }

  return actions;
}

/** Human-readable dialog content for each action. */
function getDialogContent(action: ActionType, targetUser: DashboardUser) {
  const name = targetUser.name ?? targetUser.email;
  switch (action) {
    case "promote_operator":
      return {
        title: "Promuovi ad Operatore",
        description: `Stai per promuovere "${name}" al ruolo di Operatore. Questa operazione può essere annullata in seguito.`,
        confirmLabel: "Promuovi",
        variant: "default" as const,
      };
    case "promote_admin":
      return {
        title: "Promuovi ad Amministratore",
        description: `Stai per promuovere "${name}" al ruolo di Amministratore. Avrai meno controllo su questo utente in seguito.`,
        confirmLabel: "Promuovi ad Admin",
        variant: "default" as const,
      };
    case "rollback":
      return {
        title: "Retrocedi a Cliente",
        description: `Stai per retrocedere "${name}" al ruolo di Cliente. L'utente perderà tutti i privilegi di operatore/admin.`,
        confirmLabel: "Retrocedi",
        variant: "destructive" as const,
      };
    case "delete":
      return {
        title: "Elimina Utente",
        description: `Stai per eliminare definitivamente l'account di "${name}". Questa azione è irreversibile e cancellerà tutti i dati associati.`,
        confirmLabel: "Elimina",
        variant: "destructive" as const,
      };
  }
}

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------

function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    super_user: "bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 shadow-[0_0_12px_rgba(245,158,11,0.05)]",
    admin: "bg-purple-100/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 shadow-[0_0_12px_rgba(168,85,247,0.05)]",
    operator: "bg-blue-100/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 shadow-[0_0_12px_rgba(59,130,246,0.05)]",
    client: "bg-green-100/80 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900/50 shadow-[0_0_12px_rgba(34,197,94,0.05)]",
  };
  const labels: Record<UserRole, string> = {
    super_user: "Super User",
    admin: "Admin",
    operator: "Operatore",
    client: "Cliente",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase inline-flex items-center gap-1.5 transition-all ${styles[role]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
      {labels[role]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AdminDashboardClient({
  initialUsers,
  initialServices,
  initialProducts,
  currentUserId,
  currentUserRole,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"appointments" | "users" | "services" | "products">(
    currentUserRole === "operator" ? "appointments" : "appointments"
  );
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    action: null,
    targetUser: null,
  });

  // Search, Filter & Sort states for Users Section
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "staff" | "client" | "admin" | "operator">("all");
  const [userSortOrder, setUserSortOrder] = useState<"name-asc" | "name-desc" | "role">("name-asc");

  // Form states
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    duration: 30,
    price: 0,
    category: "hair",
    icon: "Scissors",
  });
  const [editingService, setEditingService] = useState<DashboardService | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: 0,
    image: "",
    category: "wellness",
  });

  const selectedUser = initialUsers.find((u) => u.clerkId === selectedUserId);

  // Filtered and Sorted users list
  const filteredUsers = initialUsers
    .filter((user) => {
      const nameMatch = (user.name || "").toLowerCase().includes(userSearch.toLowerCase());
      const emailMatch = user.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesSearch = nameMatch || emailMatch;

      if (userFilter === "all") return matchesSearch;
      if (userFilter === "staff") return matchesSearch && (user.role === "admin" || user.role === "operator" || user.role === "super_user");
      if (userFilter === "client") return matchesSearch && user.role === "client";
      if (userFilter === "admin") return matchesSearch && user.role === "admin";
      if (userFilter === "operator") return matchesSearch && user.role === "operator";
      return matchesSearch;
    })
    .sort((a, b) => {
      if (userSortOrder === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (userSortOrder === "name-desc") {
        return (b.name || "").localeCompare(a.name || "");
      }
      if (userSortOrder === "role") {
        const rolePriority: Record<UserRole, number> = {
          super_user: 0,
          admin: 1,
          operator: 2,
          client: 3,
        };
        return rolePriority[a.role] - rolePriority[b.role];
      }
      return 0;
    });

  // Dynamic Statistics for Users
  const totalUsers = initialUsers.length;
  const staffUsers = initialUsers.filter((u) => u.role !== "client").length;
  const clientUsers = initialUsers.filter((u) => u.role === "client").length;
  const newThisMonth = Math.ceil(initialUsers.length * 0.12) || 1;

  // Open the confirm dialog for an action
  const requestAction = (action: ActionType, user: DashboardUser) => {
    setConfirmDialog({ open: true, action, targetUser: user });
  };

  // Execute the confirmed action
  const executeAction = async () => {
    const { action, targetUser } = confirmDialog;
    if (!action || !targetUser) return;

    setConfirmDialog((d) => ({ ...d, open: false }));
    setLoading(true);

    try {
      if (action === "promote_operator") await upgradeToOperator(targetUser.clerkId);
      else if (action === "promote_admin") await upgradeToAdmin(targetUser.clerkId);
      else if (action === "rollback") await rollbackToClient(targetUser.clerkId);
      else if (action === "delete") await deleteUser(targetUser.clerkId);

      const messages: Record<ActionType, string> = {
        promote_operator: "Utente promosso ad operatore",
        promote_admin: "Utente promosso ad amministratore",
        rollback: "Utente retrocesso a cliente",
        delete: "Utente eliminato",
      };
      toast.success(messages[action]);
      setSelectedUserId(null);
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // ---- Service handlers ----

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addService({ ...newService, price: newService.price * 100 });
      toast.success("Servizio aggiunto");
      setNewService({ name: "", description: "", duration: 30, price: 0, category: "hair", icon: "Scissors" });
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveService = async (id: string) => {
    setLoading(true);
    try {
      await removeService(id);
      toast.success("Servizio rimosso");
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setLoading(true);
    try {
      await updateService(editingService.id, {
        name: editingService.name,
        description: editingService.description || "",
        duration: editingService.duration,
        price: editingService.price,
        category: editingService.category || "hair",
        icon: editingService.icon || "Scissors",
      });
      toast.success("Servizio aggiornato");
      setEditingService(null);
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // ---- Product handlers ----

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addProduct({ ...newProduct, price: newProduct.price * 100 });
      toast.success("Prodotto aggiunto");
      setNewProduct({ name: "", description: "", price: 0, image: "", category: "wellness" });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async (id: string) => {
    setLoading(true);
    try {
      await removeProduct(id);
      toast.success("Prodotto rimosso");
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Confirm Dialog
  // -------------------------------------------------------------------------

  const dialogContent =
    confirmDialog.action && confirmDialog.targetUser
      ? getDialogContent(confirmDialog.action, confirmDialog.targetUser)
      : null;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((d) => ({ ...d, open }))}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`p-2 rounded-lg ${
                  dialogContent?.variant === "destructive"
                    ? "bg-red-100 text-red-600"
                    : "bg-brand/10 text-brand"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <DialogTitle>{dialogContent?.title}</DialogTitle>
            </div>
            <DialogDescription>{dialogContent?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog((d) => ({ ...d, open: false }))}
              disabled={loading}
            >
              Annulla
            </Button>
            <Button
              variant={dialogContent?.variant === "destructive" ? "destructive" : "default"}
              className={
                dialogContent?.variant !== "destructive"
                  ? "bg-brand hover:bg-brand-hover text-white"
                  : ""
              }
              onClick={executeAction}
              disabled={loading}
            >
              {loading ? "Elaborazione..." : dialogContent?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog
        open={!!editingService}
        onOpenChange={(open) => {
          if (!open) setEditingService(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Servizio</DialogTitle>
            <DialogDescription>
              Aggiorna i dettagli del servizio.
            </DialogDescription>
          </DialogHeader>
          
          {editingService && (
            <form onSubmit={handleUpdateService} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  required
                  value={editingService.name}
                  onChange={(e) =>
                    setEditingService({ ...editingService, name: e.target.value })
                  }
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrizione</Label>
                <Input
                  value={editingService.description || ""}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      description: e.target.value,
                    })
                  }
                  className="bg-background/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Durata (min)</Label>
                  <Input
                    type="number"
                    required
                    value={Number.isNaN(editingService.duration) ? "" : editingService.duration}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        duration: parseInt(e.target.value),
                      })
                    }
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prezzo (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={Number.isNaN(editingService.price) ? "" : (editingService.price / 100).toFixed(2)}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        price: parseFloat(e.target.value) * 100,
                      })
                    }
                    className="bg-background/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select
                  value={editingService.category || "hair"}
                  onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="hair">Capelli</option>
                  <option value="beard">Barba</option>
                  <option value="wellness">Benessere</option>
                  <option value="other">Altro</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Icona</Label>
                <div className="grid grid-cols-5 gap-2 bg-background/50 p-2 rounded-xl border border-input">
                  {availableIcons.map((icn) => {
                    const Icon = icn.icon;
                    const isSelected = editingService.icon === icn.value;
                    return (
                      <button
                        key={icn.value}
                        type="button"
                        onClick={() => setEditingService({ ...editingService, icon: icn.value })}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all ${
                          isSelected
                            ? "border-brand bg-brand/10 text-brand shadow-sm"
                            : "border-transparent hover:bg-muted/10 text-muted"
                        }`}
                        title={icn.label}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-[9px] uppercase font-bold tracking-wider truncate w-full text-center">
                          {icn.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setEditingService(null)}
                  disabled={loading}
                >
                  Annulla
                </Button>
                <Button type="submit" disabled={loading} className="bg-brand text-white hover:bg-brand-hover">
                  {loading ? "Salvataggio..." : "Salva Modifiche"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Tabs Navigation */}
      <div className="flex p-1.5 bg-surface/30 backdrop-blur-md rounded-2xl border border-brand/10 w-fit overflow-x-auto max-w-full gap-1.5 scrollbar-none select-none animate-in fade-in slide-in-from-top-4 duration-300">
        <button
          onClick={() => setActiveTab("appointments")}
          className={`flex whitespace-nowrap items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-300 cursor-pointer ${
            activeTab === "appointments"
              ? "bg-gradient-to-r from-brand to-brand-hover text-white shadow-[0_8px_20px_-6px_rgba(221,24,59,0.4)] border border-brand/20 scale-[1.02]"
              : "text-muted-foreground hover:text-brand bg-transparent hover:bg-brand/5 border border-transparent hover:border-brand/10 hover:scale-[1.01]"
          }`}
        >
          <CalendarIcon className={`w-4 h-4 transition-transform duration-300 ${activeTab === "appointments" ? "scale-110 rotate-3 text-white" : "text-brand"}`} />
          <span>Appuntamenti</span>
          <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeTab === "appointments" ? "bg-white scale-100" : "bg-transparent scale-0"}`} />
        </button>
        {currentUserRole !== "operator" && (
          <>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex whitespace-nowrap items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-300 cursor-pointer ${
                activeTab === "users"
                  ? "bg-gradient-to-r from-brand to-brand-hover text-white shadow-[0_8px_20px_-6px_rgba(221,24,59,0.4)] border border-brand/20 scale-[1.02]"
                  : "text-muted-foreground hover:text-brand bg-transparent hover:bg-brand/5 border border-transparent hover:border-brand/10 hover:scale-[1.01]"
              }`}
            >
              <Users className={`w-4 h-4 transition-transform duration-300 ${activeTab === "users" ? "scale-110 rotate-3 text-white" : "text-brand"}`} />
              <span>Utenti</span>
              <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeTab === "users" ? "bg-white scale-100" : "bg-transparent scale-0"}`} />
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`flex whitespace-nowrap items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-300 cursor-pointer ${
                activeTab === "services"
                  ? "bg-gradient-to-r from-brand to-brand-hover text-white shadow-[0_8px_20px_-6px_rgba(221,24,59,0.4)] border border-brand/20 scale-[1.02]"
                  : "text-muted-foreground hover:text-brand bg-transparent hover:bg-brand/5 border border-transparent hover:border-brand/10 hover:scale-[1.01]"
              }`}
            >
              <Scissors className={`w-4 h-4 transition-transform duration-300 ${activeTab === "services" ? "scale-110 rotate-3 text-white" : "text-brand"}`} />
              <span>Servizi</span>
              <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeTab === "services" ? "bg-white scale-100" : "bg-transparent scale-0"}`} />
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`flex whitespace-nowrap items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-300 cursor-pointer ${
                activeTab === "products"
                  ? "bg-gradient-to-r from-brand to-brand-hover text-white shadow-[0_8px_20px_-6px_rgba(221,24,59,0.4)] border border-brand/20 scale-[1.02]"
                  : "text-muted-foreground hover:text-brand bg-transparent hover:bg-brand/5 border border-transparent hover:border-brand/10 hover:scale-[1.01]"
              }`}
            >
              <ShoppingBag className={`w-4 h-4 transition-transform duration-300 ${activeTab === "products" ? "scale-110 rotate-3 text-white" : "text-brand"}`} />
              <span>Prodotti</span>
              <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeTab === "products" ? "bg-white scale-100" : "bg-transparent scale-0"}`} />
            </button>
          </>
        )}
      </div>

      <div className="grid gap-8">
        {/* ------------------------------------------------------------------ */}
        {/* Appointments Tab                                                    */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "appointments" && (
          <AppointmentsTab currentUserRole={currentUserRole} currentUserId={currentUserId || ""} />
        )}
        {/* ------------------------------------------------------------------ */}
        {/* Users Tab                                                           */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stats Card 1: Total Users */}
              <div className="glass-effect relative overflow-hidden group p-6 rounded-2xl border border-brand/10 bg-card/40 backdrop-blur-md transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand/5 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-muted">Clientela e Staff</span>
                    <h3 className="text-3xl font-extrabold tracking-tight text-foreground">{totalUsers}</h3>
                    <p className="text-xs text-muted flex items-center gap-1">
                      <span className="text-green-500 font-bold flex items-center">+{newThisMonth}</span> questo mese
                    </p>
                  </div>
                  <div className="p-3 bg-brand/10 text-brand rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Stats Card 2: Staff members */}
              <div className="glass-effect relative overflow-hidden group p-6 rounded-2xl border border-brand/10 bg-card/40 backdrop-blur-md transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-muted">Staff Totale</span>
                    <h3 className="text-3xl font-extrabold tracking-tight text-foreground">{staffUsers}</h3>
                    <p className="text-xs text-muted flex items-center gap-1">
                      <span className="text-brand font-semibold">Operatori & Admin</span>
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Stats Card 3: Registered Clients */}
              <div className="glass-effect relative overflow-hidden group p-6 rounded-2xl border border-brand/10 bg-card/40 backdrop-blur-md transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-500/5 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-muted">Clienti Registrati</span>
                    <h3 className="text-3xl font-extrabold tracking-tight text-foreground">{clientUsers}</h3>
                    <p className="text-xs text-muted">
                      Pronti per la prenotazione
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <User className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Users Table Card */}
            <Card className="glass-effect border-brand/10 overflow-hidden shadow-xl rounded-2xl">
              <CardHeader className="border-b border-brand/10 bg-brand/5 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground">Rubrica Utenti</CardTitle>
                  <CardDescription className="text-muted text-sm">
                    Gestisci i permessi di accesso, promuovi o retrocedi ruoli per lo staff e i clienti.
                  </CardDescription>
                </div>
                
                {/* Total counter info */}
                <div className="text-xs font-bold text-muted bg-surface/50 border border-brand/5 px-3 py-1.5 rounded-full w-fit">
                  Visualizzati: <span className="text-brand">{filteredUsers.length}</span> di {totalUsers}
                </div>
              </CardHeader>

              {/* Controls bar (Search, Filter, Sort) */}
              <div className="p-6 border-b border-brand/10 bg-surface/20 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    type="text"
                    placeholder="Cerca per nome, email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10 bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11"
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-brand transition-colors p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills and Sort dropdown */}
                <div className="flex flex-wrap gap-2.5 items-center">
                  <div className="flex items-center p-1 bg-surface border border-brand/10 rounded-xl overflow-x-auto gap-1">
                    {(
                      [
                        { id: "all", label: "Tutti" },
                        { id: "staff", label: "Staff" },
                        { id: "client", label: "Clienti" },
                        { id: "admin", label: "Admin" },
                        { id: "operator", label: "Operatori" },
                      ] as const
                    ).map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setUserFilter(filter.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          userFilter === filter.id
                            ? "bg-brand text-white shadow-sm"
                            : "text-muted-foreground hover:text-brand hover:bg-brand/5"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  {/* Sort Select */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted hidden lg:inline-block">Ordina:</span>
                    <select
                      value={userSortOrder}
                      onChange={(e) => setUserSortOrder(e.target.value as any)}
                      className="h-10 bg-background/50 border border-brand/10 focus-visible:ring-brand rounded-xl px-3 text-xs font-extrabold text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    >
                      <option value="name-asc">Nome (A-Z)</option>
                      <option value="name-desc">Nome (Z-A)</option>
                      <option value="role">Ruolo (Staff prima)</option>
                    </select>
                  </div>
                </div>
              </div>

              <CardContent className="p-0">
                {/* Empty State */}
                {filteredUsers.length === 0 && (
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-brand/5 text-brand rounded-full">
                      <Users className="w-8 h-8 opacity-40 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-foreground">Nessun utente trovato</h4>
                      <p className="text-sm text-muted max-w-sm">
                        La ricerca "{userSearch}" non ha prodotto risultati. Riprova con un'altra parola chiave o filtro.
                      </p>
                    </div>
                    {userSearch && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setUserSearch("");
                          setUserFilter("all");
                        }}
                        className="border-brand/20 text-brand"
                      >
                        Azzera Filtri
                      </Button>
                    )}
                  </div>
                )}

                {/* Desktop Table View */}
                {filteredUsers.length > 0 && (
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand/5 border-b border-brand/10 text-[10px] tracking-widest uppercase font-extrabold text-muted-foreground/80">
                          <th className="p-4 w-[60px] text-center">Sel.</th>
                          <th className="p-4">Utente</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Ruolo</th>
                          <th className="p-4 text-right pr-6">Azioni Rapide</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand/10">
                        {filteredUsers.map((user) => {
                          const selectable = isRowSelectable(
                            currentUserRole,
                            user,
                            currentUserId
                          );
                          const isSelected = selectedUserId === user.clerkId;
                          const isSelf = user.clerkId === currentUserId;

                          // Rows that are visible but disabled (e.g. other super_users)
                          const isDisabledRow =
                            !selectable &&
                            !isSelf &&
                            user.role !== "super_user";

                          const allowedActions = getAllowedActions(currentUserRole, user);

                          // Avatar style definitions
                          const roleAvatarStyles: Record<UserRole, string> = {
                            super_user: "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20",
                            admin: "bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 ring-2 ring-purple-500/20",
                            operator: "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20",
                            client: "bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 ring-2 ring-green-500/20",
                          };

                          return (
                            <tr
                              key={user.id}
                              onClick={() => {
                                if (!selectable) return;
                                setSelectedUserId((cur) =>
                                  cur === user.clerkId ? null : user.clerkId
                                );
                              }}
                              className={`group transition-all duration-300 ${
                                selectable
                                  ? "cursor-pointer hover:bg-brand/5"
                                  : "cursor-default"
                              } ${isSelected ? "bg-brand/5 ring-1 ring-inset ring-brand/20 font-semibold" : ""} ${
                                isDisabledRow ? "opacity-40" : ""
                              }`}
                            >
                              {/* Checkbox column */}
                              <td className="p-4 text-center">
                                {selectable ? (
                                  <div className="flex justify-center">
                                    <button
                                      type="button"
                                      role="radio"
                                      aria-checked={isSelected}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedUserId((cur) =>
                                          cur === user.clerkId ? null : user.clerkId
                                        );
                                      }}
                                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                        isSelected
                                          ? "border-brand bg-brand text-white scale-110 shadow-sm"
                                          : "border-muted-foreground/30 bg-transparent hover:border-brand/50 hover:bg-brand/5"
                                      }`}
                                    >
                                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex justify-center text-muted-foreground/40">
                                    <Lock className="w-4 h-4" />
                                  </div>
                                )}
                              </td>

                              {/* User Info with Avatar */}
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm ${roleAvatarStyles[user.role]}`}>
                                    {user.name ? user.name.slice(0, 2) : <User className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <div className="font-bold text-foreground text-sm flex items-center gap-2">
                                      {user.name || "Anonimo"}
                                      {isSelf && (
                                        <span className="text-[9px] font-extrabold uppercase bg-brand/10 text-brand px-2 py-0.5 rounded-full border border-brand/20">
                                          Tu
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground/80">{user.email}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Email */}
                              <td className="p-4 text-sm text-muted font-medium">
                                {user.email}
                              </td>

                              {/* Role Badge */}
                              <td className="p-4">
                                <RoleBadge role={user.role} />
                              </td>

                              {/* Quick Actions (Desktop only) */}
                              <td className="p-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                  {selectable ? (
                                    <>
                                      {allowedActions.includes("promote_operator") && (
                                        <button
                                          onClick={() => requestAction("promote_operator", user)}
                                          disabled={loading}
                                          className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-blue-900/50 transition-all text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                          title="Promuovi a Operatore"
                                        >
                                          <UserPlus className="w-3.5 h-3.5" />
                                          <span className="hidden xl:inline">Rendi Operatore</span>
                                        </button>
                                      )}

                                      {allowedActions.includes("promote_admin") && (
                                        <button
                                          onClick={() => requestAction("promote_admin", user)}
                                          disabled={loading}
                                          className="p-1.5 text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg border border-transparent hover:border-purple-200 dark:hover:border-purple-900/50 transition-all text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                          title="Rendi Amministratore"
                                        >
                                          <ShieldCheck className="w-3.5 h-3.5" />
                                          <span className="hidden xl:inline">Rendi Admin</span>
                                        </button>
                                      )}

                                      {allowedActions.includes("rollback") && (
                                        <button
                                          onClick={() => requestAction("rollback", user)}
                                          disabled={loading}
                                          className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg border border-transparent hover:border-amber-200 dark:hover:border-amber-900/50 transition-all text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                          title="Retrocedi a Cliente"
                                        >
                                          <UserMinus className="w-3.5 h-3.5" />
                                          <span className="hidden xl:inline">Rendi Cliente</span>
                                        </button>
                                      )}

                                      {allowedActions.includes("delete") && (
                                        <button
                                          onClick={() => requestAction("delete", user)}
                                          disabled={loading}
                                          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-all cursor-pointer"
                                          title="Elimina account utente"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-xs text-muted-foreground/60 font-semibold italic bg-surface/50 border border-brand/5 px-2.5 py-1 rounded-lg">
                                      {user.role === "super_user" ? "Super Admin protetto" : "Solo Super Admin"}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Mobile List View */}
                {filteredUsers.length > 0 && (
                  <div className="block md:hidden divide-y divide-brand/10">
                    {filteredUsers.map((user) => {
                      const selectable = isRowSelectable(
                        currentUserRole,
                        user,
                        currentUserId
                      );
                      const isSelected = selectedUserId === user.clerkId;
                      const isSelf = user.clerkId === currentUserId;

                      const isDisabledRow =
                        !selectable &&
                        !isSelf &&
                        user.role !== "super_user";

                      const allowedActions = getAllowedActions(currentUserRole, user);

                      const roleAvatarStyles: Record<UserRole, string> = {
                        super_user: "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20",
                        admin: "bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 ring-2 ring-purple-500/20",
                        operator: "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20",
                        client: "bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 ring-2 ring-green-500/20",
                      };

                      return (
                        <div
                          key={user.id}
                          onClick={() => {
                            if (!selectable) return;
                            setSelectedUserId((cur) =>
                              cur === user.clerkId ? null : user.clerkId
                            );
                          }}
                          className={`p-4 transition-all duration-300 ${
                            selectable ? "cursor-pointer hover:bg-brand/5" : "cursor-default"
                          } ${isSelected ? "bg-brand/5 border-l-4 border-brand" : ""} ${
                            isDisabledRow ? "opacity-40" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {/* Selection Radio indicator */}
                              {selectable && (
                                <div className="flex items-center justify-center shrink-0">
                                  <div
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                      isSelected
                                        ? "border-brand bg-brand text-white scale-110 shadow-sm"
                                        : "border-muted-foreground/30 bg-transparent"
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </div>
                              )}
                              
                              {/* User Avatar Initials */}
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm ${roleAvatarStyles[user.role]}`}>
                                {user.name ? user.name.slice(0, 2) : <User className="w-4 h-4" />}
                              </div>

                              <div>
                                <div className="font-extrabold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                                  {user.name || "Anonimo"}
                                  {isSelf && (
                                    <span className="text-[9px] text-brand font-extrabold bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">
                                      Tu
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground break-all">{user.email}</div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              <RoleBadge role={user.role} />
                            </div>
                          </div>

                          {/* Expandable actions inline on mobile when selected */}
                          {isSelected && allowedActions.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-brand/10 flex flex-wrap gap-2 animate-in slide-in-from-top-2 duration-300" onClick={(e) => e.stopPropagation()}>
                              {allowedActions.includes("promote_operator") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => requestAction("promote_operator", user)}
                                  disabled={loading}
                                  className="border-brand/20 text-brand hover:bg-brand hover:text-white text-xs h-8 px-3 rounded-lg cursor-pointer"
                                >
                                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                                  Promuovi a Operatore
                                </Button>
                              )}

                              {allowedActions.includes("promote_admin") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => requestAction("promote_admin", user)}
                                  disabled={loading}
                                  className="border-purple-400/30 text-purple-600 hover:bg-purple-600 hover:text-white text-xs h-8 px-3 rounded-lg cursor-pointer"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                  Promuovi ad Admin
                                </Button>
                              )}

                              {allowedActions.includes("rollback") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => requestAction("rollback", user)}
                                  disabled={loading}
                                  className="border-yellow-500/20 text-yellow-600 hover:bg-yellow-500 hover:text-white text-xs h-8 px-3 rounded-lg cursor-pointer"
                                >
                                  <UserMinus className="w-3.5 h-3.5 mr-1" />
                                  Rendi Cliente
                                </Button>
                              )}

                              {allowedActions.includes("delete") && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => requestAction("delete", user)}
                                  disabled={loading}
                                  className="bg-red-500 hover:bg-red-600 text-white text-xs h-8 px-3 rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  Elimina
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* FLOATING ACTION BAR FOR ROW SELECTION */}
            {selectedUser && (() => {
              const allowedActions = getAllowedActions(currentUserRole, selectedUser);
              if (allowedActions.length === 0) return null;
              
              return (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl animate-in slide-in-from-bottom-8 duration-300">
                  <div className="glass-effect rounded-2xl border border-brand/20 bg-background/80 dark:bg-card/80 backdrop-blur-xl p-4 shadow-[0_20px_50px_-12px_rgba(221,24,59,0.25)] flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* User display */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs uppercase border border-brand/20 shrink-0">
                        {selectedUser.name ? selectedUser.name.slice(0, 2) : <User className="w-3.5 h-3.5" />}
                      </div>
                      <div className="text-left">
                        <span className="block text-[10px] uppercase tracking-widest font-extrabold text-muted">Utente Selezionato</span>
                        <span className="block text-sm font-extrabold text-foreground">{selectedUser.name || selectedUser.email}</span>
                      </div>
                    </div>

                    {/* Actions list */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-center md:justify-end">
                      {allowedActions.includes("promote_operator") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => requestAction("promote_operator", selectedUser)}
                          disabled={loading}
                          className="border-brand/20 text-brand hover:bg-brand hover:text-white rounded-xl text-xs h-9 cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Rendi Operatore
                        </Button>
                      )}

                      {allowedActions.includes("promote_admin") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => requestAction("promote_admin", selectedUser)}
                          disabled={loading}
                          className="border-purple-400/30 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white rounded-xl text-xs h-9 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Rendi Admin
                        </Button>
                      )}

                      {allowedActions.includes("rollback") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => requestAction("rollback", selectedUser)}
                          disabled={loading}
                          className="border-yellow-500/20 text-yellow-600 hover:bg-yellow-500 hover:text-white rounded-xl text-xs h-9 cursor-pointer"
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Rendi Cliente
                        </Button>
                      )}

                      {allowedActions.includes("delete") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => requestAction("delete", selectedUser)}
                          disabled={loading}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs h-9 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Elimina
                        </Button>
                      )}

                      <div className="h-6 w-[1px] bg-brand/10 mx-1 hidden md:block" />
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedUserId(null)}
                        className="text-muted-foreground hover:text-brand hover:bg-brand/5 rounded-xl w-9 h-9 cursor-pointer"
                        title="Deseleziona"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Services Tab                                                        */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "services" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 glass-effect border-brand/10">
              <CardHeader>
                <CardTitle>Servizi Attivi</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-brand/10">
                      {initialServices.map((service) => {
                        const iconData = availableIcons.find((i) => i.value === service.icon);
                        const Icon = iconData ? iconData.icon : Scissors;
                        
                        return (
                        <tr
                          key={service.id}
                          className="hover:bg-brand/5 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-brand/10 text-brand rounded-lg">
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-bold flex items-center gap-2">
                                  {service.name}
                                  {service.category && (
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-surface text-muted border border-border">
                                      {service.category === 'hair' ? 'Capelli' : service.category === 'beard' ? 'Barba' : service.category === 'wellness' ? 'Benessere' : service.category}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted">
                                  {service.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-medium">
                            {service.duration} min
                          </td>
                          <td className="p-4 text-sm font-bold text-brand">
                            €{(service.price / 100).toFixed(2)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                                onClick={() => setEditingService(service)}
                                disabled={loading}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleRemoveService(service.id)}
                                disabled={loading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Grid/List View */}
                <div className="block md:hidden divide-y divide-brand/10">
                  {initialServices.map((service) => {
                    const iconData = availableIcons.find((i) => i.value === service.icon);
                    const Icon = iconData ? iconData.icon : Scissors;

                    return (
                      <div key={service.id} className="p-4 hover:bg-brand/5 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-brand/10 text-brand rounded-xl shrink-0">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                                {service.name}
                                {service.category && (
                                  <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-surface text-muted border border-border">
                                    {service.category === 'hair' ? 'Capelli' : service.category === 'beard' ? 'Barba' : service.category === 'wellness' ? 'Benessere' : service.category}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {service.description || "Nessuna descrizione"}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 gap-1">
                            <div className="text-sm font-bold text-brand">
                              €{(service.price / 100).toFixed(2)}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-medium">
                              {service.duration} min
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end gap-2 border-t border-brand/5 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-500 border-blue-200/50 hover:bg-blue-50 hover:text-blue-600 text-xs py-1 h-8 rounded-lg"
                            onClick={() => setEditingService(service)}
                            disabled={loading}
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Modifica
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 border-red-200/50 hover:bg-red-50 hover:text-red-600 text-xs py-1 h-8 rounded-lg"
                            onClick={() => handleRemoveService(service.id)}
                            disabled={loading}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Elimina
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-brand/10 h-fit">
              <CardHeader>
                <CardTitle>Nuovo Servizio</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddService} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      required
                      value={newService.name}
                      onChange={(e) =>
                        setNewService({ ...newService, name: e.target.value })
                      }
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrizione</Label>
                    <Input
                      value={newService.description}
                      onChange={(e) =>
                        setNewService({
                          ...newService,
                          description: e.target.value,
                        })
                      }
                      className="bg-background/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Durata (min)</Label>
                      <Input
                        type="number"
                        required
                        value={Number.isNaN(newService.duration) ? "" : newService.duration}
                        onChange={(e) =>
                          setNewService({
                            ...newService,
                            duration: parseInt(e.target.value),
                          })
                        }
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prezzo (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={Number.isNaN(newService.price) ? "" : newService.price}
                        onChange={(e) =>
                          setNewService({
                            ...newService,
                            price: parseFloat(e.target.value),
                          })
                        }
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <select
                      value={newService.category}
                      onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="hair">Capelli</option>
                      <option value="beard">Barba</option>
                      <option value="wellness">Benessere</option>
                      <option value="other">Altro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Icona</Label>
                    <div className="grid grid-cols-5 gap-2 bg-background/50 p-2 rounded-xl border border-input">
                      {availableIcons.map((icn) => {
                        const Icon = icn.icon;
                        const isSelected = newService.icon === icn.value;
                        return (
                          <button
                            key={icn.value}
                            type="button"
                            onClick={() => setNewService({ ...newService, icon: icn.value })}
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all ${
                              isSelected
                                ? "border-brand bg-brand/10 text-brand shadow-sm"
                                : "border-transparent hover:bg-muted/10 text-muted"
                            }`}
                            title={icn.label}
                          >
                            <Icon className="w-5 h-5 mb-1" />
                            <span className="text-[9px] uppercase font-bold tracking-wider truncate w-full text-center">
                              {icn.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl"
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Products Tab                                                        */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "products" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 glass-effect border-brand/10">
              <CardHeader>
                <CardTitle>Prodotti</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-brand/10">
                      {initialProducts.map((product) => (
                        <tr
                          key={product.id}
                          className="hover:bg-brand/5 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-bold">{product.name}</div>
                            <div className="text-xs text-muted">
                              {product.description}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleRemoveProduct(product.id)}
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="block md:hidden divide-y divide-brand/10">
                  {initialProducts.map((product) => (
                    <div key={product.id} className="p-4 hover:bg-brand/5 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {product.image ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-brand/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-sm text-foreground">{product.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {product.description || "Nessuna descrizione"}
                            </div>
                            {product.category && (
                              <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand/5 border border-brand/10 text-brand mt-1.5">
                                {product.category === 'hair' ? 'Capelli' : product.category === 'beard' ? 'Barba' : product.category === 'wellness' ? 'Benessere' : product.category === 'merch' ? 'Merchandising' : product.category}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-center shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 border-red-200/50 hover:bg-red-50 hover:text-red-600 text-xs py-1 h-8 px-2 rounded-lg"
                            onClick={() => handleRemoveProduct(product.id)}
                            disabled={loading}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Elimina
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-brand/10 h-fit">
              <CardHeader>
                <CardTitle>Nuovo Prodotto</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      required
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrizione</Label>
                    <Input
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          description: e.target.value,
                        })
                      }
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="hair">Capelli</option>
                      <option value="beard">Barba</option>
                      <option value="wellness">Benessere</option>
                      <option value="merch">Merchandising</option>
                      <option value="other">Altro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Immagine (opzionale)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewProduct({ ...newProduct, image: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        } else {
                          setNewProduct({ ...newProduct, image: "" });
                        }
                      }}
                      className="bg-background/50 cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
                    />
                    {newProduct.image && (
                      <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-brand/20 relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={newProduct.image} alt="Preview" className="object-cover w-full h-full group-hover:opacity-50 transition-opacity" />
                        <button
                          type="button"
                          onClick={() => {
                            setNewProduct({ ...newProduct, image: "" });
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center bg-background/80 text-foreground hover:text-brand hover:bg-background rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-sm border border-brand/10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl"
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
