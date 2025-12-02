import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TreePine, Snowflake, Lock, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { loginSchema, type LoginInput } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import AnnouncementsList from "@/components/announcements-list";

const roleRedirects = {
  user: "/user",
  parent: "/parent",
  developer: "/developer",
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, isAuthenticated, role } = useAuth();

  useEffect(() => {
    if (isAuthenticated && role) {
      setLocation(roleRedirects[role as keyof typeof roleRedirects]);
    }
  }, [isAuthenticated, role, setLocation]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", data);
      const response = await res.json();

      if (response.success && response.account) {
        login({
          id: response.account.id,
          username: response.account.username,
          displayName: response.account.displayName,
          role: response.account.role,
        });
        
        toast({
          title: "Connexion reussie",
          description: `Bienvenue ${response.account.displayName} !`,
        });
        
        setLocation(roleRedirects[response.account.role as keyof typeof roleRedirects]);
      } else {
        toast({
          title: "Erreur de connexion",
          description: response.message || "Identifiant ou mot de passe incorrect",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erreur de connexion",
        description: "Identifiant ou mot de passe incorrect",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <TreePine className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Ma Liste de Noel</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center space-y-2 mb-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <TreePine className="h-16 w-16 text-primary" />
                <Snowflake className="h-6 w-6 text-chart-3 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Bienvenue</h1>
            <p className="text-muted-foreground">
              Connectez-vous pour acceder a votre espace
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Connexion</CardTitle>
              <CardDescription>
                Entrez vos identifiants pour continuer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identifiant</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Entrez votre identifiant"
                              className="pl-10"
                              data-testid="input-username"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="Entrez votre mot de passe"
                              className="pl-10"
                              data-testid="input-password"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? "Connexion..." : "Se connecter"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          {/* Announcements banner below login card */}
          <div className="mt-6">
            <AnnouncementsList />
          </div>
        </div>
      </main>

      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border">
        <p>Fait avec amour pour des fetes magiques</p>
      </footer>
    </div>
  );
}
