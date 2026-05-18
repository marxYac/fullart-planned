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
  Calendar as CalendarIcon
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
    super_user: "bg-amber-100 text-amber-700 border border-amber-200",
    admin: "bg-purple-100 text-purple-700 border border-purple-200",
    operator: "bg-blue-100 text-blue-700 border border-blue-200",
    client: "bg-green-100 text-green-700 border border-green-200",
  };
  const labels: Record<UserRole, string> = {
    super_user: "Super User",
    admin: "Admin",
    operator: "Operatore",
    client: "Cliente",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${styles[role]}`}
    >
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
      <div className={`grid ${currentUserRole === 'operator' ? 'grid-cols-1' : 'grid-cols-2 sm:flex'} p-1 bg-surface rounded-2xl border border-brand/10 w-full sm:w-fit gap-1 sm:gap-0`}>
        <button
          onClick={() => setActiveTab("appointments")}
          className={`flex whitespace-nowrap items-center justify-center gap-2 px-3 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all w-full sm:w-auto ${
            activeTab === "appointments"
              ? "bg-brand text-white shadow-lg shadow-brand/20"
              : "hover:bg-brand/5 text-muted hover:text-brand"
          }`}
        >
          <CalendarIcon className="w-4 h-4 shrink-0" />
          <span>Appuntamenti</span>
        </button>
        {currentUserRole !== "operator" && (
          <>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex whitespace-nowrap items-center justify-center gap-2 px-3 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all w-full sm:w-auto ${
                activeTab === "users"
                  ? "bg-brand text-white shadow-lg shadow-brand/20"
                  : "hover:bg-brand/5 text-muted hover:text-brand"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Utenti</span>
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`flex whitespace-nowrap items-center justify-center gap-2 px-3 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all w-full sm:w-auto ${
                activeTab === "services"
                  ? "bg-brand text-white shadow-lg shadow-brand/20"
                  : "hover:bg-brand/5 text-muted hover:text-brand"
              }`}
            >
              <Scissors className="w-4 h-4 shrink-0" />
              <span>Servizi</span>
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`flex whitespace-nowrap items-center justify-center gap-2 px-3 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all w-full sm:w-auto ${
                activeTab === "products"
                  ? "bg-brand text-white shadow-lg shadow-brand/20"
                  : "hover:bg-brand/5 text-muted hover:text-brand"
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Prodotti</span>
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
          <Card className="glass-effect border-brand/10 overflow-hidden">
            <CardHeader className="border-b border-brand/10 bg-brand/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Gestione Utenti</CardTitle>
                <CardDescription>
                  Visualizza e gestisci i ruoli degli utenti.
                </CardDescription>
              </div>

              {/* Action toolbar — shown when a user is selected */}
              {selectedUser && (() => {
                const allowedActions = getAllowedActions(currentUserRole, selectedUser);
                return (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand/10 bg-background/70 p-2">
                    <span className="inline-flex items-center gap-2 text-sm text-muted mr-2">
                      <CheckSquare className="w-4 h-4 text-brand" />
                      {selectedUser.name || selectedUser.email}
                    </span>

                    {allowedActions.includes("promote_operator") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => requestAction("promote_operator", selectedUser)}
                        disabled={loading}
                        className="border-brand/20 text-brand hover:bg-brand hover:text-white"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Promuovi a Operatore
                      </Button>
                    )}

                    {allowedActions.includes("promote_admin") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => requestAction("promote_admin", selectedUser)}
                        disabled={loading}
                        className="border-purple-400/30 text-purple-600 hover:bg-purple-600 hover:text-white"
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Promuovi ad Admin
                      </Button>
                    )}

                    {allowedActions.includes("rollback") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => requestAction("rollback", selectedUser)}
                        disabled={loading}
                        className="border-yellow-500/20 text-yellow-600 hover:bg-yellow-500 hover:text-white"
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
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Elimina
                      </Button>
                    )}
                  </div>
                );
              })()}
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand/5 text-xs uppercase tracking-widest font-bold">
                      <th className="p-4 w-[72px]">Sel.</th>
                      <th className="p-4">Nome</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Ruolo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand/10">
                    {initialUsers.map((user) => {
                      const selectable = isRowSelectable(
                        currentUserRole,
                        user,
                        currentUserId
                      );
                      const isSelected = selectedUserId === user.clerkId;
                      const isSelf = user.clerkId === currentUserId;

                      // Rows that are visible but disabled (e.g. admin sees other admins/super_user as greyed-out)
                      const isDisabledRow =
                        !selectable &&
                        !isSelf &&
                        user.role !== "super_user";

                      return (
                        <tr
                          key={user.id}
                          onClick={() => {
                            if (!selectable) return;
                            setSelectedUserId((cur) =>
                              cur === user.clerkId ? null : user.clerkId
                            );
                          }}
                          className={`transition-colors ${
                            selectable
                              ? "cursor-pointer hover:bg-brand/5"
                              : "cursor-default"
                          } ${isSelected ? "bg-brand/5 ring-1 ring-inset ring-brand/20" : ""} ${
                            isDisabledRow ? "opacity-40" : ""
                          }`}
                        >
                          <td className="p-4">
                            <button
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              disabled={!selectable}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!selectable) return;
                                setSelectedUserId((cur) =>
                                  cur === user.clerkId ? null : user.clerkId
                                );
                              }}
                              className={`group relative flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                selectable
                                  ? "cursor-pointer"
                                  : "cursor-not-allowed opacity-50"
                              } ${
                                isSelected
                                  ? "border-brand bg-transparent"
                                  : "border-muted-foreground/30 bg-transparent hover:border-brand/50 hover:bg-brand/5"
                              }`}
                            >
                              <div
                                className={`h-2.5 w-2.5 rounded-full bg-brand transition-all duration-200 ${
                                  isSelected
                                    ? "scale-100 opacity-100"
                                    : "scale-50 opacity-0"
                                }`}
                              />
                            </button>
                          </td>
                          <td className="p-4 font-medium">
                            {user.name || "N/A"}
                            {isSelf && (
                              <span className="ml-2 text-xs text-brand font-bold">
                                (Tu)
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-muted">{user.email}</td>
                          <td className="p-4">
                            <RoleBadge role={user.role} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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
                <div className="overflow-x-auto">
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
                <div className="overflow-x-auto">
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
                          <td className="p-4 text-sm font-bold text-brand">
                            €{(product.price / 100).toFixed(2)}
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
                    <Label>Prezzo (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={Number.isNaN(newProduct.price) ? "" : newProduct.price}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          price: parseFloat(e.target.value),
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
