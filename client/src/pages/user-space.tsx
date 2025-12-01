import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Gift,
  Plus,
  Trash2,
  Edit2,
  Send,
  LogOut,
  TreePine,
  ImagePlus,
  Link as LinkIcon,
  X,
  Package,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertWishListItemSchema, type WishListItem, type WishList } from "@shared/schema";
import { z } from "zod";

const formSchema = insertWishListItemSchema.extend({
  title: z.string().min(1, "Le titre est requis"),
  quantity: z.coerce.number().min(1, "Quantite minimum: 1"),
});

type FormValues = z.infer<typeof formSchema>;

export default function UserSpacePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, displayName, logout } = useAuth();
  const username = user?.username || displayName;
  const [editingItem, setEditingItem] = useState<WishListItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageTab, setImageTab] = useState<"upload" | "url">("url");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      quantity: 1,
      image: "",
      imageUrl: "",
    },
  });

  const { data: currentList, isLoading } = useQuery<WishList | null>({
    queryKey: ["/api/lists/current", username],
    queryFn: async () => {
      const res = await fetch(`/api/lists/current?username=${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!username,
  });

  const items = currentList?.items || [];

  const addItemMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/lists/items", {
        ...data,
        username,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists/current", username] });
      form.reset();
      setIsDialogOpen(false);
      toast({
        title: "Article ajoute",
        description: "L'article a ete ajoute a votre liste",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'article",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: FormValues & { id: string }) => {
      const res = await apiRequest("PUT", `/api/lists/items/${data.id}`, {
        ...data,
        username,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists/current", username] });
      form.reset();
      setEditingItem(null);
      setIsDialogOpen(false);
      toast({
        title: "Article modifie",
        description: "L'article a ete mis a jour",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'article",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/lists/items/${id}`, { username });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists/current", username] });
      toast({
        title: "Article supprime",
        description: "L'article a ete retire de votre liste",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'article",
        variant: "destructive",
      });
    },
  });

  const sendListMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/lists/send", { username });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists/current", username] });
      toast({
        title: "Liste envoyee !",
        description: "Votre liste de Noel a ete envoyee avec succes",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la liste",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FormValues) {
    if (editingItem) {
      updateItemMutation.mutate({ ...data, id: editingItem.id });
    } else {
      addItemMutation.mutate(data);
    }
  }

  function handleEdit(item: WishListItem) {
    setEditingItem(item);
    form.reset({
      title: item.title,
      description: item.description || "",
      quantity: item.quantity,
      image: item.image || "",
      imageUrl: item.imageUrl || "",
    });
    setIsDialogOpen(true);
  }

  function handleLogout() {
    logout();
    setLocation("/");
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("image", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  const getItemImage = (item: WishListItem) => {
    return item.image || item.imageUrl || null;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TreePine className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-semibold text-lg leading-tight">Ma Liste de Noel</h1>
              <p className="text-sm text-muted-foreground">
                Bienvenue, {displayName || "utilisateur"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              Mes souhaits
            </h2>
            <p className="text-muted-foreground mt-1">
              {items.length} article{items.length !== 1 ? "s" : ""} dans votre liste
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingItem(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-item">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un article
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Modifier l'article" : "Ajouter un article"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "Modifiez les details de votre souhait"
                    : "Ajoutez un nouveau souhait a votre liste de Noel"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Console de jeux"
                            data-testid="input-item-title"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ajoutez des details..."
                            className="resize-none"
                            data-testid="input-item-description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantite</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            data-testid="input-item-quantity"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <FormLabel>Image (optionnel)</FormLabel>
                    <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as "upload" | "url")}>
                      <TabsList className="w-full">
                        <TabsTrigger value="url" className="flex-1" data-testid="tab-image-url">
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Lien URL
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="flex-1" data-testid="tab-image-upload">
                          <ImagePlus className="h-4 w-4 mr-2" />
                          Telecharger
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="url" className="mt-3">
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/image.jpg"
                                  data-testid="input-image-url"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      <TabsContent value="upload" className="mt-3">
                        <div className="border-2 border-dashed border-border rounded-md p-6 text-center hover:border-primary/50 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                            data-testid="input-image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="cursor-pointer flex flex-col items-center gap-2"
                          >
                            <ImagePlus className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Cliquez pour telecharger une image
                            </span>
                          </label>
                          {form.watch("image") && (
                            <div className="mt-3 relative inline-block">
                              <img
                                src={form.watch("image")}
                                alt="Preview"
                                className="max-h-32 rounded-md"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6"
                                onClick={() => form.setValue("image", "")}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" data-testid="button-cancel-item">
                        Annuler
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      disabled={addItemMutation.isPending || updateItemMutation.isPending}
                      data-testid="button-save-item"
                    >
                      {editingItem ? "Modifier" : "Ajouter"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-40 w-full mb-4 rounded-md" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Package className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Votre liste est vide</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Commencez a ajouter vos souhaits de Noel pour les partager avec votre famille
              </p>
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-item">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter mon premier souhait
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {items.map((item) => {
                const imageUrl = getItemImage(item);
                return (
                  <Card key={item.id} className="overflow-hidden hover-elevate" data-testid={`card-item-${item.id}`}>
                    {imageUrl && (
                      <div className="aspect-video bg-muted overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                        <Badge variant="secondary" className="shrink-0">
                          x{item.quantity}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {item.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(item)}
                          data-testid={`button-edit-${item.id}`}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`button-delete-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer l'article ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Etes-vous sur de vouloir supprimer "{item.title}" de votre liste ?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-delete">Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteItemMutation.mutate(item.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-testid="button-confirm-delete"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="sticky bottom-4 flex justify-center">
              <Button
                size="lg"
                className="shadow-lg gap-2"
                onClick={() => sendListMutation.mutate()}
                disabled={sendListMutation.isPending || items.length === 0}
                data-testid="button-send-list"
              >
                {sendListMutation.isPending ? (
                  "Envoi en cours..."
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Envoyer ma liste
                    <Sparkles className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
