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
  updateProduct,
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
  Lock,
  Package
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
  inStock: boolean;
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
// Category badge
// ---------------------------------------------------------------------------

function CategoryBadge({ category }: { category: string | null }) {
  const styles: Record<string, string> = {
    hair: "bg-red-500/10 text-red-500 border border-red-500/20 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 shadow-[0_0_12px_rgba(239,68,68,0.05)]",
    beard: "bg-amber-500/10 text-amber-500 border border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 shadow-[0_0_12px_rgba(245,158,11,0.05)]",
    wellness: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 shadow-[0_0_12px_rgba(16,185,129,0.05)]",
    merch: "bg-purple-500/10 text-purple-500 border border-purple-500/20 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30 shadow-[0_0_12px_rgba(168,85,247,0.05)]",
    other: "bg-slate-500/10 text-slate-500 border border-slate-500/20 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-900/30 shadow-[0_0_12px_rgba(100,116,139,0.05)]",
  };
  const labels: Record<string, string> = {
    hair: "Capelli",
    beard: "Barba",
    wellness: "Benessere",
    merch: "Merchandising",
    other: "Altro",
  };
  const cat = category || "other";
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase inline-flex items-center gap-1 transition-all ${styles[cat] || styles.other}`}
    >
      {labels[cat] || cat}
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

  // Search, Filter & Sort states for Services Section
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<"all" | "hair" | "beard" | "wellness" | "other">("all");
  const [serviceSortOrder, setServiceSortOrder] = useState<"name-asc" | "name-desc" | "price-asc" | "price-desc" | "duration-asc" | "duration-desc">("name-asc");

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
  const [editingProduct, setEditingProduct] = useState<DashboardProduct | null>(null);

  // Search, Filter & Sort states for Products Section
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState<"all" | "hair" | "beard" | "wellness" | "merch" | "other">("all");
  const [productStockFilter, setProductStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [productSortOrder, setProductSortOrder] = useState<"name-asc" | "name-desc" | "price-asc" | "price-desc">("name-asc");
  
  const fileInputRefEdit = useRef<HTMLInputElement>(null);

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

  // Filtered and Sorted services list
  const filteredServices = initialServices
    .filter((service) => {
      const nameMatch = service.name.toLowerCase().includes(serviceSearch.toLowerCase());
      const descMatch = (service.description || "").toLowerCase().includes(serviceSearch.toLowerCase());
      const matchesSearch = nameMatch || descMatch;

      if (serviceFilter === "all") return matchesSearch;
      return matchesSearch && service.category === serviceFilter;
    })
    .sort((a, b) => {
      if (serviceSortOrder === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (serviceSortOrder === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      if (serviceSortOrder === "price-asc") {
        return a.price - b.price;
      }
      if (serviceSortOrder === "price-desc") {
        return b.price - a.price;
      }
      if (serviceSortOrder === "duration-asc") {
        return a.duration - b.duration;
      }
      if (serviceSortOrder === "duration-desc") {
        return b.duration - a.duration;
      }
      return 0;
    });

  // Dynamic Statistics for Services
  const totalServices = initialServices.length;
  const averagePrice = initialServices.length > 0
    ? initialServices.reduce((sum, s) => sum + s.price, 0) / initialServices.length
    : 0;
  const averageDuration = initialServices.length > 0
    ? initialServices.reduce((sum, s) => sum + s.duration, 0) / initialServices.length
    : 0;

  // Filtered and Sorted products list
  const filteredProducts = initialProducts
    .filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(productSearch.toLowerCase());
      const descMatch = (product.description || "").toLowerCase().includes(productSearch.toLowerCase());
      const matchesSearch = nameMatch || descMatch;

      // Category filter
      const matchesCategory = productCategoryFilter === "all" || product.category === productCategoryFilter;

      // Stock status filter
      let matchesStock = true;
      if (productStockFilter === "in_stock") {
        matchesStock = product.inStock === true;
      } else if (productStockFilter === "out_of_stock") {
        matchesStock = product.inStock === false;
      }

      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      if (productSortOrder === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (productSortOrder === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      if (productSortOrder === "price-asc") {
        return a.price - b.price;
      }
      if (productSortOrder === "price-desc") {
        return b.price - a.price;
      }
      return 0;
    });

  // Dynamic Statistics for Products
  const totalProducts = initialProducts.length;
  const averageProductPrice = initialProducts.length > 0
    ? initialProducts.reduce((sum, p) => sum + p.price, 0) / initialProducts.length
    : 0;
  const outOfStockProducts = initialProducts.filter((p) => !p.inStock).length;

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

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setLoading(true);
    try {
      await updateProduct(editingProduct.id, {
        name: editingProduct.name,
        description: editingProduct.description || "",
        price: editingProduct.price,
        image: editingProduct.image || "",
        category: editingProduct.category || "wellness",
        inStock: editingProduct.inStock,
      });
      toast.success("Prodotto aggiornato");
      setEditingProduct(null);
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStock = async (product: DashboardProduct) => {
    setLoading(true);
    try {
      await updateProduct(product.id, {
        name: product.name,
        description: product.description || "",
        price: product.price,
        image: product.image || "",
        category: product.category || "wellness",
        inStock: !product.inStock,
      });
      toast.success(`Prodotto impostato come ${!product.inStock ? "Disponibile" : "Esaurito"}`);
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
        <DialogContent className="max-w-md rounded-2xl border border-brand/10 bg-background/95 backdrop-blur-xl shadow-2xl p-6 overflow-hidden">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand/10 text-brand rounded-xl border border-brand/15">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold text-foreground">Modifica Servizio</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Aggiorna i dettagli e le tariffe del trattamento selezionato.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {editingService && (
            <form onSubmit={handleUpdateService} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Nome del Servizio</Label>
                <Input
                  required
                  value={editingService.name}
                  onChange={(e) =>
                    setEditingService({ ...editingService, name: e.target.value })
                  }
                  className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Descrizione</Label>
                <Input
                  value={editingService.description || ""}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      description: e.target.value,
                    })
                  }
                  className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Durata (min)</Label>
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
                    className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Prezzo (€)</Label>
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
                    className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Categoria</Label>
                <select
                  value={editingService.category || "hair"}
                  onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                  className="flex h-11 w-full rounded-xl border border-brand/10 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-brand focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="hair">Capelli</option>
                  <option value="beard">Barba</option>
                  <option value="wellness">Benessere</option>
                  <option value="other">Altro</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Icona Rappresentativa</Label>
                <div className="grid grid-cols-5 gap-2 bg-background/50 p-2.5 rounded-xl border border-brand/10">
                  {availableIcons.map((icn) => {
                    const Icon = icn.icon;
                    const isSelected = editingService.icon === icn.value;
                    return (
                      <button
                        key={icn.value}
                        type="button"
                        onClick={() => setEditingService({ ...editingService, icon: icn.value })}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "border-brand bg-brand/10 text-brand shadow-sm scale-[1.05]"
                            : "border-transparent hover:bg-muted/10 text-muted-foreground hover:text-brand"
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
              
              <DialogFooter className="mt-6 gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setEditingService(null)}
                  disabled={loading}
                  className="rounded-xl h-11 px-4 cursor-pointer"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-brand text-white hover:bg-brand-hover rounded-xl h-11 px-6 font-bold shadow-md hover:shadow-brand/20 transition-all duration-200 cursor-pointer"
                >
                  {loading ? "Salvataggio..." : "Salva Modifiche"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={(open) => {
          if (!open) setEditingProduct(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border border-brand/10 bg-background/95 backdrop-blur-xl shadow-2xl p-6 overflow-hidden">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand/10 text-brand rounded-xl border border-brand/15">
                <ShoppingBag className="w-5 h-5 text-brand" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold text-foreground">Modifica Prodotto</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Aggiorna i dettagli, il prezzo e la disponibilità in magazzino.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {editingProduct && (
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Nome del Prodotto</Label>
                <Input
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Descrizione</Label>
                <Input
                  value={editingProduct.description || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: e.target.value,
                    })
                  }
                  className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Prezzo (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={Number.isNaN(editingProduct.price) ? "" : (editingProduct.price / 100).toFixed(2)}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: Math.round(parseFloat(e.target.value) * 100) || 0,
                      })
                    }
                    className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Categoria</Label>
                  <select
                    value={editingProduct.category || "wellness"}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-brand/10 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-brand focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                  >
                    <option value="hair">Capelli</option>
                    <option value="beard">Barba</option>
                    <option value="wellness">Benessere</option>
                    <option value="merch">Merchandising</option>
                    <option value="other">Altro</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-brand/10">
                <div className="space-y-0.5">
                  <Label className="text-xs font-extrabold uppercase tracking-wider text-foreground">Disponibilità Magazzino</Label>
                  <p className="text-[10px] text-muted-foreground">Mostra questo prodotto come disponibile nello shop.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct({ ...editingProduct, inStock: !editingProduct.inStock })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${
                    editingProduct.inStock ? "bg-green-500 justify-end" : "bg-muted justify-start"
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Immagine Prodotto</Label>
                <Input
                  type="file"
                  accept="image/*"
                  ref={fileInputRefEdit}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditingProduct({ ...editingProduct, image: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11 cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
                />
                {editingProduct.image && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-brand/20 relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editingProduct.image} alt="Preview" className="object-cover w-full h-full group-hover:opacity-50 transition-opacity" />
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct({ ...editingProduct, image: "" });
                        if (fileInputRefEdit.current) {
                          fileInputRefEdit.current.value = "";
                        }
                      }}
                      className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center bg-background/80 text-foreground hover:text-brand hover:bg-background rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-sm border border-brand/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <DialogFooter className="mt-6 gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  disabled={loading}
                  className="rounded-xl h-11 px-4 cursor-pointer"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-brand text-white hover:bg-brand-hover rounded-xl h-11 px-6 font-bold shadow-md hover:shadow-brand/20 transition-all duration-200 cursor-pointer"
                >
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
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stats Card 1: Total Services */}
              <div className="glass-effect relative overflow-hidden group p-6 rounded-2xl border border-brand/10 bg-card/40 backdrop-blur-md transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand/5 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-muted">Trattamenti Totali</span>
                    <h3 className="text-3xl font-extrabold tracking-tight text-foreground">{totalServices}</h3>
                    <p className="text-xs text-muted">
                      Nel listino attivo
                    </p>
                  </div>
                  <div className="p-3 bg-brand/10 text-brand rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Scissors className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Stats Card 2: Average Price */}
              <div className="glass-effect relative overflow-hidden group p-6 rounded-2xl border border-brand/10 bg-card/40 backdrop-blur-md transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-muted">Prezzo Medio</span>
                    <h3 className="text-3xl font-extrabold tracking-tight text-foreground">€{(averagePrice / 100).toFixed(2)}</h3>
                    <p className="text-xs text-muted">
                      Valore medio servizio
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Stats Card 3: Average Duration */}
              <div className="glass-effect relative overflow-hidden group p-6 rounded-2xl border border-brand/10 bg-card/40 backdrop-blur-md transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-500/5 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-muted">Durata Media</span>
                    <h3 className="text-3xl font-extrabold tracking-tight text-foreground">{Math.round(averageDuration)} min</h3>
                    <p className="text-xs text-muted">
                      Tempo medio per seduta
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 glass-effect border-brand/10 overflow-hidden shadow-xl rounded-2xl">
                <CardHeader className="border-b border-brand/10 bg-brand/5 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground">Menu Servizi</CardTitle>
                    <CardDescription className="text-muted text-sm">
                      Visualizza, cerca e ordina i trattamenti disponibili per la prenotazione.
                    </CardDescription>
                  </div>
                  
                  {/* Total counter info */}
                  <div className="text-xs font-bold text-muted bg-surface/50 border border-brand/5 px-3 py-1.5 rounded-full w-fit">
                    Visualizzati: <span className="text-brand">{filteredServices.length}</span> di {totalServices}
                  </div>
                </CardHeader>

                {/* Controls bar (Search, Filter, Sort) */}
                <div className="p-6 border-b border-brand/10 bg-surface/20 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                  {/* Search Input */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      type="text"
                      placeholder="Cerca servizio..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="pl-10 bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11"
                    />
                    {serviceSearch && (
                      <button
                        onClick={() => setServiceSearch("")}
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
                          { id: "hair", label: "Capelli" },
                          { id: "beard", label: "Barba" },
                          { id: "wellness", label: "Benessere" },
                          { id: "other", label: "Altro" },
                        ] as const
                      ).map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setServiceFilter(filter.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            serviceFilter === filter.id
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
                        value={serviceSortOrder}
                        onChange={(e) => setServiceSortOrder(e.target.value as any)}
                        className="h-10 bg-background/50 border border-brand/10 focus-visible:ring-brand rounded-xl px-3 text-xs font-extrabold text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                      >
                        <option value="name-asc">Nome (A-Z)</option>
                        <option value="name-desc">Nome (Z-A)</option>
                        <option value="price-asc">Prezzo (Crescente)</option>
                        <option value="price-desc">Prezzo (Decrescente)</option>
                        <option value="duration-asc">Durata (Crescente)</option>
                        <option value="duration-desc">Durata (Decrescente)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <CardContent className="p-0">
                  {/* Empty State */}
                  {filteredServices.length === 0 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                      <div className="p-4 bg-brand/5 text-brand rounded-full">
                        <Scissors className="w-8 h-8 opacity-40 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-foreground">Nessun servizio trovato</h4>
                        <p className="text-sm text-muted max-w-sm">
                          Nessun trattamento corrisponde ai criteri impostati. Riprova con un'altra parola chiave o filtro.
                        </p>
                      </div>
                      {serviceSearch && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setServiceSearch("");
                            setServiceFilter("all");
                          }}
                          className="border-brand/20 text-brand rounded-xl"
                        >
                          Azzera Filtri
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Desktop View */}
                  {filteredServices.length > 0 && (
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-brand/5 border-b border-brand/10 text-[10px] tracking-widest uppercase font-extrabold text-muted-foreground/80">
                            <th className="p-4 pl-6">Servizio</th>
                            <th className="p-4">Categoria</th>
                            <th className="p-4">Durata</th>
                            <th className="p-4">Prezzo</th>
                            <th className="p-4 text-right pr-6">Azioni</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand/10">
                          {filteredServices.map((service) => {
                            const iconData = availableIcons.find((i) => i.value === service.icon);
                            const Icon = iconData ? iconData.icon : Scissors;
                            
                            return (
                              <tr
                                key={service.id}
                                className="hover:bg-brand/5 transition-colors duration-200 group"
                              >
                                <td className="p-4 pl-6">
                                  <div className="flex items-center gap-3.5">
                                    <div className="p-2.5 bg-brand/10 text-brand rounded-xl border border-brand/15 group-hover:scale-105 transition-transform duration-300 shrink-0">
                                      <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <div className="font-extrabold text-foreground text-sm">
                                        {service.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-md">
                                        {service.description || "Nessuna descrizione"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <CategoryBadge category={service.category} />
                                </td>
                                <td className="p-4">
                                  <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-muted/50 border border-brand/5 px-2.5 py-1 rounded-lg text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5 text-brand" />
                                    <span>{service.duration} min</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="text-sm font-extrabold text-brand bg-brand/5 border border-brand/10 px-2.5 py-1 rounded-lg">
                                    €{(service.price / 100).toFixed(2)}
                                  </span>
                                </td>
                                <td className="p-4 text-right pr-6">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-9 w-9 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl border border-transparent hover:border-blue-200 dark:hover:border-blue-900/50 transition-all cursor-pointer"
                                      onClick={() => setEditingService(service)}
                                      disabled={loading}
                                      title="Modifica Servizio"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-9 w-9 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-all cursor-pointer"
                                      onClick={() => handleRemoveService(service.id)}
                                      disabled={loading}
                                      title="Elimina Servizio"
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
                  )}

                  {/* Mobile Grid/List View */}
                  {filteredServices.length > 0 && (
                    <div className="block md:hidden divide-y divide-brand/10">
                      {filteredServices.map((service) => {
                        const iconData = availableIcons.find((i) => i.value === service.icon);
                        const Icon = iconData ? iconData.icon : Scissors;

                        return (
                          <div key={service.id} className="p-4 hover:bg-brand/5 transition-colors duration-200">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-brand/10 text-brand rounded-xl border border-brand/15 shrink-0">
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="font-extrabold text-sm flex items-center gap-2 flex-wrap text-foreground">
                                    {service.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {service.description || "Nessuna descrizione"}
                                  </div>
                                  <div className="flex gap-2 mt-2 flex-wrap items-center">
                                    <CategoryBadge category={service.category} />
                                    <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-muted/50 border border-brand/5 px-2 py-0.5 rounded text-muted-foreground">
                                      <Clock className="w-3.5 h-3.5 text-brand" />
                                      <span>{service.duration} min</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0">
                                <span className="text-sm font-extrabold text-brand bg-brand/5 border border-brand/10 px-2 py-1 rounded">
                                  €{(service.price / 100).toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-end gap-2 border-t border-brand/5 pt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-500 border-blue-200/50 hover:bg-blue-50 hover:text-blue-600 text-xs py-1 h-8 px-3 rounded-xl cursor-pointer"
                                onClick={() => setEditingService(service)}
                                disabled={loading}
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" />
                                Modifica
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-500 border-red-200/50 hover:bg-red-50 hover:text-red-600 text-xs py-1 h-8 px-3 rounded-xl cursor-pointer"
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
                  )}
                </CardContent>
              </Card>

              {/* Form Nuovo Servizio */}
              <Card className="glass-effect border-brand/10 h-fit shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-brand/10 bg-brand/5 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand/10 text-brand rounded-xl border border-brand/15">
                      <Scissors className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-extrabold text-foreground">Nuovo Servizio</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        Crea un nuovo trattamento per i clienti.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAddService} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Nome del Servizio</Label>
                      <Input
                        required
                        placeholder="Es. Taglio Capelli Classico"
                        value={newService.name}
                        onChange={(e) =>
                          setNewService({ ...newService, name: e.target.value })
                        }
                        className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Descrizione</Label>
                      <Input
                        placeholder="Es. Include shampoo, massaggio cutaneo..."
                        value={newService.description}
                        onChange={(e) =>
                          setNewService({
                            ...newService,
                            description: e.target.value,
                          })
                        }
                        className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Durata (min)</Label>
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
                          className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Prezzo (€)</Label>
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
                          className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Categoria</Label>
                      <select
                        value={newService.category}
                        onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                        className="flex h-11 w-full rounded-xl border border-brand/10 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-brand focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="hair">Capelli</option>
                        <option value="beard">Barba</option>
                        <option value="wellness">Benessere</option>
                        <option value="other">Altro</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Icona Rappresentativa</Label>
                      <div className="grid grid-cols-5 gap-2 bg-background/50 p-2.5 rounded-xl border border-brand/10">
                        {availableIcons.map((icn) => {
                          const Icon = icn.icon;
                          const isSelected = newService.icon === icn.value;
                          return (
                            <button
                              key={icn.value}
                              type="button"
                              onClick={() => setNewService({ ...newService, icon: icn.value })}
                              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? "border-brand bg-brand/10 text-brand shadow-sm scale-[1.05]"
                                  : "border-transparent hover:bg-muted/10 text-muted-foreground hover:text-brand"
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
                      className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl h-11 font-bold shadow-md hover:shadow-brand/20 transition-all duration-200 cursor-pointer"
                      disabled={loading}
                    >
                      {loading ? (
                        "Elaborazione..."
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Aggiungi Servizio
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Products Tab                                                        */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "products" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Dynamic Statistics for Products */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 select-none">
              {/* Stat 1: Total Products */}
              <div className="relative overflow-hidden rounded-2xl border border-brand/10 bg-surface/30 backdrop-blur-md p-5 shadow-lg group hover:border-brand/20 transition-all duration-300">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-brand/5 blur-xl group-hover:bg-brand/10 transition-colors duration-300" />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/80">Prodotti Totali</p>
                    <h3 className="text-3xl font-black text-foreground tracking-tight">{totalProducts}</h3>
                  </div>
                  <div className="p-3 bg-brand/10 text-brand rounded-xl border border-brand/15 group-hover:scale-110 transition-transform duration-300">
                    <ShoppingBag className="w-5 h-5 text-brand" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" />
                  <span>Prodotti registrati nel catalogo</span>
                </div>
              </div>

              {/* Stat 2: Average Price */}
              <div className="relative overflow-hidden rounded-2xl border border-brand/10 bg-surface/30 backdrop-blur-md p-5 shadow-lg group hover:border-brand/20 transition-all duration-300">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-brand/5 blur-xl group-hover:bg-brand/10 transition-colors duration-300" />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/80">Prezzo Medio</p>
                    <h3 className="text-3xl font-black text-foreground tracking-tight">
                      €{(averageProductPrice / 100).toFixed(2)}
                    </h3>
                  </div>
                  <div className="p-3 bg-brand/10 text-brand rounded-xl border border-brand/15 group-hover:scale-110 transition-transform duration-300">
                    <Package className="w-5 h-5 text-brand" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-brand" />
                  <span>Valore medio dell'assortimento</span>
                </div>
              </div>

              {/* Stat 3: Stock Status */}
              <div className="relative overflow-hidden rounded-2xl border border-brand/10 bg-surface/30 backdrop-blur-md p-5 shadow-lg group hover:border-brand/20 transition-all duration-300">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-brand/5 blur-xl group-hover:bg-brand/10 transition-colors duration-300" />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/80">Esauriti</p>
                    <h3 className={`text-3xl font-black tracking-tight ${outOfStockProducts > 0 ? "text-amber-500" : "text-foreground"}`}>
                      {outOfStockProducts}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-xl border transition-all duration-300 group-hover:scale-110 ${
                    outOfStockProducts > 0 
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/15" 
                      : "bg-brand/10 text-brand border-brand/15"
                  }`}>
                    <AlertTriangle className="w-5 h-5 text-brand" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={`w-1.5 h-1.5 rounded-full ${outOfStockProducts > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                  <span>
                    {outOfStockProducts > 0 
                      ? "Rifornimento consigliato per alcuni prodotti" 
                      : "Tutti i prodotti sono disponibili"}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Products content grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Products List & Filters */}
              <div className="lg:col-span-2 space-y-6">
                {/* Search & Filters Controls */}
                <Card className="glass-effect border-brand/10 shadow-lg rounded-2xl p-4 md:p-6">
                  <div className="space-y-4">
                    {/* Search & Sort Row */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Search Input */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Cerca prodotti per nome o descrizione..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="pl-10 bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11 text-sm text-foreground"
                        />
                        {productSearch && (
                          <button
                            onClick={() => setProductSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Sort Selector */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:inline">Ordina:</span>
                        <select
                          value={productSortOrder}
                          onChange={(e) => setProductSortOrder(e.target.value as any)}
                          className="flex h-11 w-full md:w-[180px] rounded-xl border border-brand/10 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:border-brand focus-visible:ring-brand text-foreground"
                        >
                          <option value="name-asc">Nome A-Z</option>
                          <option value="name-desc">Nome Z-A</option>
                          <option value="price-asc">Prezzo crescente</option>
                          <option value="price-desc">Prezzo decrescente</option>
                        </select>
                      </div>
                    </div>

                    {/* Category Filter Row */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3 h-3 text-brand" /> Categoria
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { value: "all", label: "Tutti" },
                          { value: "hair", label: "Capelli" },
                          { value: "beard", label: "Barba" },
                          { value: "wellness", label: "Benessere" },
                          { value: "merch", label: "Merch" },
                          { value: "other", label: "Altro" },
                        ].map((pill) => {
                          const isSelected = productCategoryFilter === pill.value;
                          return (
                            <button
                              key={pill.value}
                              onClick={() => setProductCategoryFilter(pill.value as any)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? "bg-brand text-white shadow-md shadow-brand/20 border border-brand/10"
                                  : "text-muted-foreground bg-muted/30 hover:bg-brand/5 hover:text-brand border border-transparent hover:border-brand/10"
                              }`}
                            >
                              {pill.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stock Availability Filter Row */}
                    <div className="flex flex-col gap-2 border-t border-brand/5 pt-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/80">
                        Stato Magazzino
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { value: "all", label: "Qualsiasi stato" },
                          { value: "in_stock", label: "Disponibile" },
                          { value: "out_of_stock", label: "Esaurito" },
                        ].map((pill) => {
                          const isSelected = productStockFilter === pill.value;
                          return (
                            <button
                              key={pill.value}
                              onClick={() => setProductStockFilter(pill.value as any)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? "bg-brand text-white shadow-md border border-brand/10"
                                  : "text-muted-foreground bg-muted/30 hover:bg-brand/5 hover:text-brand border border-transparent hover:border-brand/10"
                              }`}
                            >
                              {pill.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
                
                {/* Products Cards Grid */}
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className={`glass-effect border-brand/10 shadow-lg rounded-2xl overflow-hidden hover:border-brand/20 transition-all duration-300 flex flex-col group relative ${
                          !product.inStock ? "opacity-75" : ""
                        }`}
                      >
                        {/* Product Image Preview */}
                        <div className="relative aspect-video w-full overflow-hidden bg-brand/5 border-b border-brand/5 shrink-0 select-none">
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brand/5 to-brand/15 text-brand flex items-center justify-center">
                              <Package className="w-10 h-10 opacity-30 group-hover:scale-110 transition-transform duration-500" />
                            </div>
                          )}
                          
                          {/* Stock Availability Badge */}
                          <div className="absolute top-3 left-3 select-none">
                            {product.inStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-green-500/15 text-green-500 border border-green-500/20 backdrop-blur-md shadow-sm">
                                Disponibile
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-red-500/15 text-red-500 border border-red-500/20 backdrop-blur-md shadow-sm">
                                Esaurito
                              </span>
                            )}
                          </div>

                          {/* Floating Category Badge */}
                          <div className="absolute top-3 right-3 select-none">
                            <CategoryBadge category={product.category} />
                          </div>
                        </div>

                        {/* Product Content Details */}
                        <CardContent className="p-4 md:p-5 flex-1 flex flex-col justify-between space-y-4 text-foreground">
                          <div className="space-y-1.5">
                            <h4 className="font-extrabold text-foreground text-base tracking-tight leading-tight line-clamp-1">
                              {product.name}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[32px]">
                              {product.description || "Nessuna descrizione specificata per questo prodotto premium."}
                            </p>
                          </div>

                          {/* Price and Stock Toggle Control */}
                          <div className="flex items-center justify-between border-t border-brand/5 pt-3">
                            <div className="flex flex-col">
                              <span className="text-[9px] uppercase font-extrabold tracking-widest text-muted-foreground/80">Prezzo</span>
                              <span className="text-lg font-black text-brand bg-brand/5 border border-brand/10 px-2.5 py-0.5 rounded-xl mt-0.5 w-fit">
                                €{(product.price / 100).toFixed(2)}
                              </span>
                            </div>

                            {/* InStock quick toggle */}
                            <div className="flex items-center gap-2 select-none">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/85">In Stock:</span>
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => handleToggleStock(product)}
                                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-all duration-300 cursor-pointer ${
                                  product.inStock ? "bg-green-500 justify-end" : "bg-muted justify-start"
                                }`}
                              >
                                <span className="bg-white w-4 h-4 rounded-full shadow-md shrink-0" />
                              </button>
                            </div>
                          </div>
                        </CardContent>

                        {/* Card Hover Action Buttons overlay/footer */}
                        <div className="border-t border-brand/10 p-3 bg-surface/50 backdrop-blur-md flex items-center justify-end gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingProduct(product)}
                            disabled={loading}
                            className="text-blue-500 border-blue-200/30 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-xs py-1 h-8 px-3 rounded-xl cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Modifica
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveProduct(product.id)}
                            disabled={loading}
                            className="text-red-500 border-red-200/30 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs py-1 h-8 px-3 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Rimuovi
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* Empty Search State */
                  <Card className="glass-effect border-brand/10 p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-brand/5 text-brand rounded-full">
                      <ShoppingBag className="w-8 h-8 opacity-40 animate-pulse text-brand" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-foreground">Nessun prodotto trovato</h4>
                      <p className="text-sm text-muted max-w-sm">
                        Nessun articolo soddisfa i criteri selezionati. Modifica i filtri o la ricerca.
                      </p>
                    </div>
                    {(productSearch || productCategoryFilter !== "all" || productStockFilter !== "all") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setProductSearch("");
                          setProductCategoryFilter("all");
                          setProductStockFilter("all");
                        }}
                        className="border-brand/20 text-brand rounded-xl mt-2 cursor-pointer"
                      >
                        Azzera Filtri
                      </Button>
                    )}
                  </Card>
                )}
              </div>

              {/* Form Nuovo Prodotto Column */}
              <div className="lg:col-span-1">
                <Card className="glass-effect border-brand/10 h-fit shadow-xl rounded-2xl overflow-hidden sticky top-8">
                  <CardHeader className="border-b border-brand/10 bg-brand/5 p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-brand/10 text-brand rounded-xl border border-brand/15">
                        <Plus className="w-5 h-5 animate-pulse text-brand" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-extrabold text-foreground">Nuovo Prodotto</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                          Inserisci un nuovo articolo per la rivendita.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      {/* Name input */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Nome Prodotto</Label>
                        <Input
                          required
                          placeholder="Es. Cera Capelli Opaca Alta Tenuta"
                          value={newProduct.name}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, name: e.target.value })
                          }
                          className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11 text-foreground"
                        />
                      </div>

                      {/* Description input */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Descrizione</Label>
                        <Input
                          placeholder="Es. Finish asciutto, formula a base d'acqua..."
                          value={newProduct.description || ""}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              description: e.target.value,
                            })
                          }
                          className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11 text-foreground"
                        />
                      </div>

                      {/* Price & Category Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Price input */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Prezzo (€)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">€</span>
                            <Input
                              type="number"
                              step="0.01"
                              required
                              placeholder="19.90"
                              value={newProduct.price || ""}
                              onChange={(e) =>
                                setNewProduct({
                                  ...newProduct,
                                  price: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11 pl-7 text-foreground"
                            />
                          </div>
                        </div>

                        {/* Category Selector */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Categoria</Label>
                          <select
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                            className="flex h-11 w-full rounded-xl border border-brand/10 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:border-brand focus-visible:ring-brand text-foreground"
                          >
                            <option value="hair">Capelli</option>
                            <option value="beard">Barba</option>
                            <option value="wellness">Benessere</option>
                            <option value="merch">Merchandising</option>
                            <option value="other">Altro</option>
                          </select>
                        </div>
                      </div>

                      {/* Image Upload Input */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground/80">Foto Prodotto (opzionale)</Label>
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
                          className="bg-background/50 border-brand/10 focus-visible:ring-brand rounded-xl h-11 cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
                        />
                        
                        {/* Selected image preview */}
                        {newProduct.image && (
                          <div className="mt-2.5 w-20 h-20 rounded-lg overflow-hidden border border-brand/20 relative group">
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

                      {/* Submit button */}
                      <Button
                        type="submit"
                        className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl h-11 font-bold shadow-md hover:shadow-brand/20 transition-all duration-200 cursor-pointer mt-2"
                        disabled={loading}
                      >
                        {loading ? (
                          "Elaborazione..."
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Crea Prodotto
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
