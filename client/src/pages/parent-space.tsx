import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  LogOut,
  TreePine,
  Download,
  Eye,
  Calendar,
  Package,
  Gift,
  ChevronRight,
  Search,
  Inbox,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import type { WishList } from "@shared/schema";

export default function ParentSpacePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [selectedList, setSelectedList] = useState<WishList | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: lists = [], isLoading } = useQuery<WishList[]>({
    queryKey: ["/api/lists"],
  });

  const filteredLists = lists.filter((list) =>
    list.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleLogout() {
    logout();
    setLocation("/");
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function downloadList(list: WishList) {
    const blob = new Blob([JSON.stringify(list, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liste-noel-${list.username}-${list.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Telechargement",
      description: `La liste de ${list.username} a ete telechargee`,
    });
  }

  function getTotalItems(list: WishList) {
    return list.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  function getPreviewImages(list: WishList, max: number = 3) {
    return list.items
      .filter((item) => item.image || item.imageUrl)
      .slice(0, max)
      .map((item) => item.image || item.imageUrl);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TreePine className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-semibold text-lg leading-tight flex items-center gap-2">
                <Users className="h-5 w-5 text-chart-3" />
                Espace Parent
              </h1>
              <p className="text-sm text-muted-foreground">
                Consultez les listes de la famille
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

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              Listes de Noel
            </h2>
            <p className="text-muted-foreground mt-1">
              {lists.length} liste{lists.length !== 1 ? "s" : ""} recue{lists.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-lists"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredLists.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-chart-3/10 mb-4">
                <Inbox className="h-12 w-12 text-chart-3" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? "Aucun resultat" : "Aucune liste recue"}
              </h3>
              <p className="text-muted-foreground max-w-sm">
                {searchQuery
                  ? `Aucune liste ne correspond a "${searchQuery}"`
                  : "Les listes de Noel de la famille apparaitront ici une fois envoyees"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLists.map((list) => {
              const previewImages = getPreviewImages(list);
              return (
                <Card key={list.id} className="overflow-hidden hover-elevate" data-testid={`card-list-${list.id}`}>
                  {previewImages.length > 0 && (
                    <div className="flex h-24 bg-muted overflow-hidden">
                      {previewImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="flex-1 overflow-hidden"
                          style={{ maxWidth: `${100 / previewImages.length}%` }}
                        >
                          <img
                            src={img!}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{list.username}</CardTitle>
                      <Badge variant="secondary">
                        {list.items.length} article{list.items.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(list.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Package className="h-4 w-4" />
                      <span>Total: {getTotalItems(list)} article{getTotalItems(list) !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedList(list)}
                        data-testid={`button-view-${list.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => downloadList(list)}
                        data-testid={`button-download-${list.id}`}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        JSON
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!selectedList} onOpenChange={() => setSelectedList(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          {selectedList && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Liste de {selectedList.username}
                </DialogTitle>
                <DialogDescription>
                  {selectedList.items.length} article{selectedList.items.length !== 1 ? "s" : ""} - Envoyee le {formatDate(selectedList.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4">
                  {selectedList.items.map((item, index) => {
                    const imageUrl = item.image || item.imageUrl;
                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 p-4 rounded-md bg-muted/50"
                        data-testid={`dialog-item-${item.id}`}
                      >
                        {imageUrl && (
                          <div className="w-24 h-24 rounded-md overflow-hidden bg-muted shrink-0">
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-medium">{index + 1}. {item.title}</h4>
                            <Badge variant="secondary" className="shrink-0">
                              x{item.quantity}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                          {item.imageUrl && (
                            <a
                              href={item.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                            >
                              Voir le lien
                              <ChevronRight className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => downloadList(selectedList)}
                  data-testid="button-download-dialog"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Telecharger JSON
                </Button>
                <Button onClick={() => setSelectedList(null)} data-testid="button-close-dialog">
                  Fermer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
