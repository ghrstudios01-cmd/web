import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gift, Users, Settings, TreePine, Snowflake, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { loginSchema, type UserRole } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const extendedLoginSchema = loginSchema.extend({
  username: z.string().optional(),
});

type ExtendedLoginInput = z.infer<typeof extendedLoginSchema>;

const roleConfig = {
  user: {
    title: "Espace Utilisateur",
    description: "Creez et gerez votre liste de Noel",
    icon: Gift,
    color: "text-primary",
    bgColor: "bg-primary/10",
    redirect: "/user",
  },
  parent: {
    title: "Espace Parent",
    description: "Consultez les listes de toute la famille",
    icon: Users,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
    redirect: "/parent",
  },
  developer: {
    title: "Espace Developpeur",
    description: "Administration et gestion du site",
    icon: Settings,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
    redirect: "/developer",
  },
};

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<ExtendedLoginInput>({
    resolver: zodResolver(extendedLoginSchema),
    defaultValues: {
      password: "",
      username: "",
    },
  });

  async function onSubmit(data: ExtendedLoginInput) {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", {
        role: selectedRole,
        password: data.password,
        username: data.username,
      });
      const response = await res.json();

      if (response.success) {
        login(selectedRole, data.username);
        toast({
          title: "Connexion reussie",
          description: `Bienvenue ${selectedRole === "user" ? data.username || "utilisateur" : selectedRole === "parent" ? "parent" : "developpeur"} !`,
        });
        setLocation(roleConfig[selectedRole].redirect);
      } else {
        toast({
          title: "Erreur de connexion",
          description: response.message || "Mot de passe incorrect",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erreur de connexion",
        description: "Mot de passe incorrect ou erreur serveur",
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
          {!selectedRole ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <TreePine className="h-16 w-16 text-primary" />
                    <Snowflake className="h-6 w-6 text-chart-3 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold">Bienvenue</h1>
                <p className="text-muted-foreground">
                  Choisissez votre espace pour continuer
                </p>
              </div>

              <div className="space-y-3">
                {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                  const config = roleConfig[role];
                  const Icon = config.icon;
                  return (
                    <Card
                      key={role}
                      className="cursor-pointer hover-elevate active-elevate-2 transition-all duration-200"
                      onClick={() => setSelectedRole(role)}
                      data-testid={`card-role-${role}`}
                    >
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className={`p-3 rounded-md ${config.bgColor}`}>
                          <Icon className={`h-6 w-6 ${config.color}`} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{config.title}</CardTitle>
                          <CardDescription>{config.description}</CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`p-4 rounded-full ${roleConfig[selectedRole].bgColor}`}>
                    {(() => {
                      const Icon = roleConfig[selectedRole].icon;
                      return <Icon className={`h-8 w-8 ${roleConfig[selectedRole].color}`} />;
                    })()}
                  </div>
                </div>
                <CardTitle className="text-2xl">{roleConfig[selectedRole].title}</CardTitle>
                <CardDescription>
                  Entrez votre mot de passe pour acceder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {selectedRole === "user" && (
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Votre prenom</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Entrez votre prenom"
                                data-testid="input-username"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
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
                                placeholder="Entrez le mot de passe"
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
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedRole(null);
                          form.reset();
                        }}
                        data-testid="button-back"
                      >
                        Retour
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isLoading}
                        data-testid="button-login"
                      >
                        {isLoading ? "Connexion..." : "Se connecter"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border">
        <p>Fait avec amour pour des fetes magiques</p>
      </footer>
    </div>
  );
}
