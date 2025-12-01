import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Settings,
  LogOut,
  TreePine,
  Users,
  FileText,
  BarChart3,
  Cog,
  Plus,
  Trash2,
  Edit2,
  Megaphone,
  Gift,
  AlertTriangle,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  UserPlus,
  Bell,
  Mail,
  Clock,
  Key,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  insertUserSchema,
  insertAnnouncementSchema,
  insertAccountSchema,
  type User,
  type Announcement,
  type WishList,
  type Stats,
  type Config,
  type UserRole,
} from "@shared/schema";
import { z } from "zod";

type TabType = "accounts" | "users" | "lists" | "announcements" | "stats" | "settings";

type Account = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
};

const userFormSchema = insertUserSchema.extend({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
});

const announcementFormSchema = insertAnnouncementSchema.extend({
  title: z.string().min(1, "Le titre est requis"),
  content: z.string().min(1, "Le contenu est requis"),
});

const accountFormSchema = insertAccountSchema.extend({
  username: z.string().min(1, "L'identifiant est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  displayName: z.string().min(1, "Le nom est requis"),
  role: z.enum(["user", "parent", "developer"]),
});

const passwordFormSchema = z.object({
  userPassword: z.string().min(1, "Mot de passe utilisateur requis"),
  parentPassword: z.string().min(1, "Mot de passe parent requis"),
  devPassword: z.string().min(1, "Mot de passe developpeur requis"),
});

const roleLabels: Record<UserRole, string> = {
  user: "Utilisateur",
  parent: "Parent",
  developer: "Developpeur",
};

const roleBadgeVariants: Record<UserRole, "default" | "secondary" | "outline"> = {
  user: "secondary",
  parent: "default",
  developer: "outline",
};

export default function DeveloperSpacePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { displayName, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("stats");
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [showAccountPassword, setShowAccountPassword] = useState(false);

  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: lists = [], isLoading: loadingLists } = useQuery<WishList[]>({
    queryKey: ["/api/lists"],
  });

  const { data: announcements = [], isLoading: loadingAnnouncements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: stats, isLoading: loadingStats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: config } = useQuery<Config>({
    queryKey: ["/api/config"],
  });

  const userForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  const announcementForm = useForm<z.infer<typeof announcementFormSchema>>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: "",
      content: "",
      isActive: true,
    },
  });

  const accountForm = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      username: "",
      password: "",
      displayName: "",
      role: "user",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      userPassword: config?.userPassword || "",
      parentPassword: config?.parentPassword || "",
      devPassword: config?.devPassword || "",
    },
    values: config
      ? {
          userPassword: config.userPassword,
          parentPassword: config.parentPassword,
          devPassword: config.devPassword,
        }
      : undefined,
  });

  // Account mutations
  const createAccountMutation = useMutation({
    mutationFn: (data: z.infer<typeof accountFormSchema>) =>
      apiRequest("POST", "/api/accounts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      accountForm.reset();
      setIsAccountDialogOpen(false);
      toast({ title: "Compte cree", description: "Le compte a ete ajoute avec succes" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de creer le compte. L'identifiant existe peut-etre deja.", variant: "destructive" });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: (data: z.infer<typeof accountFormSchema> & { id: string }) =>
      apiRequest("PUT", `/api/accounts/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      accountForm.reset();
      setEditingAccount(null);
      setIsAccountDialogOpen(false);
      toast({ title: "Compte modifie", description: "Les modifications ont ete enregistrees" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le compte", variant: "destructive" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Compte supprime", description: "Le compte a ete retire" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer le compte", variant: "destructive" });
    },
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: (data: z.infer<typeof userFormSchema>) =>
      apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      userForm.reset();
      setIsUserDialogOpen(false);
      toast({ title: "Utilisateur cree", description: "L'utilisateur a ete ajoute avec succes" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de creer l'utilisateur", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: z.infer<typeof userFormSchema> & { id: string }) =>
      apiRequest("PUT", `/api/users/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      userForm.reset();
      setEditingUser(null);
      setIsUserDialogOpen(false);
      toast({ title: "Utilisateur modifie", description: "Les modifications ont ete enregistrees" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier l'utilisateur", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Utilisateur supprime", description: "L'utilisateur a ete retire" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer l'utilisateur", variant: "destructive" });
    },
  });

  // Announcement mutations
  const createAnnouncementMutation = useMutation({
    mutationFn: (data: z.infer<typeof announcementFormSchema>) =>
      apiRequest("POST", "/api/announcements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      announcementForm.reset();
      setIsAnnouncementDialogOpen(false);
      toast({ title: "Annonce creee", description: "L'annonce a ete publiee" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de creer l'annonce", variant: "destructive" });
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: (data: z.infer<typeof announcementFormSchema> & { id: string }) =>
      apiRequest("PUT", `/api/announcements/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      announcementForm.reset();
      setEditingAnnouncement(null);
      setIsAnnouncementDialogOpen(false);
      toast({ title: "Annonce modifiee", description: "Les modifications ont ete enregistrees" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier l'annonce", variant: "destructive" });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Annonce supprimee", description: "L'annonce a ete retiree" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer l'annonce", variant: "destructive" });
    },
  });

  // Settings mutations
  const updatePasswordsMutation = useMutation({
    mutationFn: (data: z.infer<typeof passwordFormSchema>) =>
      apiRequest("PUT", "/api/config/passwords", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Mots de passe mis a jour", description: "Les nouveaux mots de passe sont actifs" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre a jour les mots de passe", variant: "destructive" });
    },
  });

  const resetAllListsMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/lists/reset"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Listes reintialisees", description: "Toutes les listes ont ete supprimees" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de reinitialiser les listes", variant: "destructive" });
    },
  });

  function handleLogout() {
    logout();
    setLocation("/");
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function handleEditAccount(account: Account) {
    setEditingAccount(account);
    accountForm.reset({
      username: account.username,
      password: "",
      displayName: account.displayName,
      role: account.role,
    });
    setIsAccountDialogOpen(true);
  }

  function handleEditUser(user: User) {
    setEditingUser(user);
    userForm.reset({
      username: user.username,
      email: user.email || "",
    });
    setIsUserDialogOpen(true);
  }

  function handleEditAnnouncement(announcement: Announcement) {
    setEditingAnnouncement(announcement);
    announcementForm.reset({
      title: announcement.title,
      content: announcement.content,
      isActive: announcement.isActive,
    });
    setIsAnnouncementDialogOpen(true);
  }

  function onAccountSubmit(data: z.infer<typeof accountFormSchema>) {
    if (editingAccount) {
      const updateData = data.password ? data : { ...data, password: undefined };
      updateAccountMutation.mutate({ ...updateData, id: editingAccount.id } as z.infer<typeof accountFormSchema> & { id: string });
    } else {
      createAccountMutation.mutate(data);
    }
  }

  function onUserSubmit(data: z.infer<typeof userFormSchema>) {
    if (editingUser) {
      updateUserMutation.mutate({ ...data, id: editingUser.id });
    } else {
      createUserMutation.mutate(data);
    }
  }

  function onAnnouncementSubmit(data: z.infer<typeof announcementFormSchema>) {
    if (editingAnnouncement) {
      updateAnnouncementMutation.mutate({ ...data, id: editingAnnouncement.id });
    } else {
      createAnnouncementMutation.mutate(data);
    }
  }

  const tabs: { id: TabType; label: string; icon: typeof Users }[] = [
    { id: "stats", label: "Statistiques", icon: BarChart3 },
    { id: "accounts", label: "Comptes", icon: Key },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "lists", label: "Listes", icon: Gift },
    { id: "announcements", label: "Annonces", icon: Megaphone },
    { id: "settings", label: "Parametres", icon: Cog },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <TreePine className="h-6 w-6 text-primary" />
            <span className="font-semibold">Admin Panel</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenue, {displayName || "Admin"}
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 mb-3">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">Theme</span>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Deconnexion
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-chart-4" />
              <h1 className="text-xl font-semibold">Espace Developpeur</h1>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === "stats" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Tableau de bord</h2>

              {loadingStats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-4 w-24" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-16" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card data-testid="stat-accounts">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Comptes
                      </CardTitle>
                      <Key className="h-4 w-4 text-chart-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalAccounts || 0}</div>
                    </CardContent>
                  </Card>

                  <Card data-testid="stat-lists">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Listes totales
                      </CardTitle>
                      <Gift className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalLists || 0}</div>
                    </CardContent>
                  </Card>

                  <Card data-testid="stat-items">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Articles totaux
                      </CardTitle>
                      <FileText className="h-4 w-4 text-chart-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
                    </CardContent>
                  </Card>

                  <Card data-testid="stat-announcements">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Annonces
                      </CardTitle>
                      <Megaphone className="h-4 w-4 text-chart-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalAnnouncements || 0}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Activite recente
                  </CardTitle>
                  <CardDescription>Les dernieres listes recues</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingLists ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : lists.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aucune activite recente</p>
                  ) : (
                    <div className="space-y-3">
                      {lists.slice(0, 5).map((list) => (
                        <div
                          key={list.id}
                          className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                              <Gift className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{list.username}</p>
                              <p className="text-sm text-muted-foreground">
                                {list.items.length} article{list.items.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(list.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "accounts" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Gestion des comptes</h2>
                  <p className="text-muted-foreground">Creez et gerez les identifiants de connexion</p>
                </div>
                <Button
                  onClick={() => {
                    setEditingAccount(null);
                    accountForm.reset({ username: "", password: "", displayName: "", role: "user" });
                    setIsAccountDialogOpen(true);
                  }}
                  data-testid="button-add-account"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nouveau compte
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  {loadingAccounts ? (
                    <div className="p-6 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="p-12 text-center">
                      <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun compte enregistre</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Identifiant</TableHead>
                          <TableHead>Nom affiche</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Date creation</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accounts.map((account) => (
                          <TableRow key={account.id} data-testid={`row-account-${account.id}`}>
                            <TableCell className="font-medium">{account.username}</TableCell>
                            <TableCell>{account.displayName}</TableCell>
                            <TableCell>
                              <Badge variant={roleBadgeVariants[account.role]}>
                                {roleLabels[account.role]}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(account.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditAccount(account)}
                                  data-testid={`button-edit-account-${account.id}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      data-testid={`button-delete-account-${account.id}`}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Supprimer le compte ?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Cette action est irreversible. Le compte "{account.username}" sera supprime.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteAccountMutation.mutate(account.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Supprimer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
                <Button
                  onClick={() => {
                    setEditingUser(null);
                    userForm.reset();
                    setIsUserDialogOpen(true);
                  }}
                  data-testid="button-add-user"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  {loadingUsers ? (
                    <div className="p-6 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun utilisateur enregistre</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Date creation</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>
                              {user.email ? (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditUser(user)}
                                  data-testid={`button-edit-user-${user.id}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      data-testid={`button-delete-user-${user.id}`}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Cette action est irreversible. L'utilisateur "{user.username}" sera supprime.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteUserMutation.mutate(user.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Supprimer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "lists" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Listes de Noel</h2>

              <Card>
                <CardContent className="p-0">
                  {loadingLists ? (
                    <div className="p-6 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : lists.length === 0 ? (
                    <div className="p-12 text-center">
                      <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune liste recue</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Articles</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lists.map((list) => (
                          <TableRow key={list.id} data-testid={`row-list-${list.id}`}>
                            <TableCell className="font-medium">{list.username}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {list.items.length} article{list.items.length !== 1 ? "s" : ""}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(list.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "announcements" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Annonces</h2>
                <Button
                  onClick={() => {
                    setEditingAnnouncement(null);
                    announcementForm.reset();
                    setIsAnnouncementDialogOpen(true);
                  }}
                  data-testid="button-add-announcement"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle annonce
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  {loadingAnnouncements ? (
                    <div className="p-6 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="p-12 text-center">
                      <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune annonce</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {announcements.map((announcement) => (
                        <div
                          key={announcement.id}
                          className="p-4 flex items-start justify-between gap-4"
                          data-testid={`row-announcement-${announcement.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{announcement.title}</h4>
                              <Badge variant={announcement.isActive ? "default" : "secondary"}>
                                {announcement.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {announcement.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(announcement.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditAnnouncement(announcement)}
                              data-testid={`button-edit-announcement-${announcement.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={`button-delete-announcement-${announcement.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer l'annonce ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irreversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Parametres</h2>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Zone dangereuse
                  </CardTitle>
                  <CardDescription>
                    Actions irreversibles sur les donnees
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" data-testid="button-reset-lists">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reinitialiser toutes les listes
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reinitialiser toutes les listes ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irreversible. Toutes les listes de Noel seront supprimees.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => resetAllListsMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Reinitialiser
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Dialog open={isAccountDialogOpen} onOpenChange={(open) => {
        setIsAccountDialogOpen(open);
        if (!open) {
          setEditingAccount(null);
          accountForm.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Modifier le compte" : "Nouveau compte"}
            </DialogTitle>
            <DialogDescription>
              {editingAccount
                ? "Modifiez les informations du compte"
                : "Creez un nouveau compte avec identifiant et mot de passe"}
            </DialogDescription>
          </DialogHeader>
          <Form {...accountForm}>
            <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4">
              <FormField
                control={accountForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom affiche *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Marie"
                        data-testid="input-account-displayname"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={accountForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identifiant *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: marie123"
                        data-testid="input-account-username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={accountForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Mot de passe {editingAccount ? "(laisser vide pour ne pas changer)" : "*"}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showAccountPassword ? "text" : "password"}
                          placeholder="Mot de passe"
                          data-testid="input-account-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowAccountPassword(!showAccountPassword)}
                        >
                          {showAccountPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={accountForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-account-role">
                          <SelectValue placeholder="Choisir un role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Utilisateur (enfant)</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="developer">Developpeur (admin)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
                  data-testid="button-save-account"
                >
                  {editingAccount ? "Modifier" : "Creer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isUserDialogOpen} onOpenChange={(open) => {
        setIsUserDialogOpen(open);
        if (!open) {
          setEditingUser(null);
          userForm.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Modifiez les informations de l'utilisateur"
                : "Ajoutez un nouvel utilisateur au systeme"}
            </DialogDescription>
          </DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
              <FormField
                control={userForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'utilisateur *</FormLabel>
                    <FormControl>
                      <Input data-testid="input-user-username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (optionnel)</FormLabel>
                    <FormControl>
                      <Input type="email" data-testid="input-user-email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  data-testid="button-save-user"
                >
                  {editingUser ? "Modifier" : "Creer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAnnouncementDialogOpen} onOpenChange={(open) => {
        setIsAnnouncementDialogOpen(open);
        if (!open) {
          setEditingAnnouncement(null);
          announcementForm.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Modifier l'annonce" : "Nouvelle annonce"}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncement
                ? "Modifiez le contenu de l'annonce"
                : "Creez une nouvelle annonce pour les utilisateurs"}
            </DialogDescription>
          </DialogHeader>
          <Form {...announcementForm}>
            <form onSubmit={announcementForm.handleSubmit(onAnnouncementSubmit)} className="space-y-4">
              <FormField
                control={announcementForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre *</FormLabel>
                    <FormControl>
                      <Input data-testid="input-announcement-title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={announcementForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenu *</FormLabel>
                    <FormControl>
                      <Textarea
                        className="resize-none"
                        rows={4}
                        data-testid="input-announcement-content"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={announcementForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel className="mb-0">Active</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        L'annonce sera visible par tous
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-announcement-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
                  data-testid="button-save-announcement"
                >
                  {editingAnnouncement ? "Modifier" : "Publier"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
