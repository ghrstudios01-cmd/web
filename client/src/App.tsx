import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import LoginPage from "@/pages/login";
import UserSpacePage from "@/pages/user-space";
import ParentSpacePage from "@/pages/parent-space";
import DeveloperSpacePage from "@/pages/developer-space";
import NotFound from "@/pages/not-found";

function ProtectedRoute({
  component: Component,
  allowedRoles,
}: {
  component: React.ComponentType;
  allowedRoles: string[];
}) {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated || !role) {
    return <Redirect to="/" />;
  }

  if (!allowedRoles.includes(role)) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/user">
        <ProtectedRoute component={UserSpacePage} allowedRoles={["user"]} />
      </Route>
      <Route path="/parent">
        <ProtectedRoute component={ParentSpacePage} allowedRoles={["parent"]} />
      </Route>
      <Route path="/developer">
        <ProtectedRoute component={DeveloperSpacePage} allowedRoles={["developer"]} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
