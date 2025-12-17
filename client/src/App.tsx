import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppLayout } from "./components/AppLayout";
import { Toaster } from "sonner";

// Pages
import Dashboard from "./pages/Dashboard";
import DashboardPerformance from "./pages/DashboardPerformance";
import LeadManagement from "./pages/LeadManagement";
import Kanban from "./pages/Kanban";
import Feed from "./pages/Feed";
import Loja from "./pages/Loja";
import Perfil from "./pages/Perfil";
import Equipe from "./pages/Equipe";
import AdminSprints from "./pages/admin/AdminSprints";
import AdminTarefas from "./pages/admin/AdminTarefas";
import Apresentacao from "./pages/Apresentacao";
import Login from "./pages/Login";

function AppRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/performance" component={DashboardPerformance} />
        <Route path="/leads" component={LeadManagement} />
        <Route path="/kanban" component={Kanban} />
        <Route path="/feed" component={Feed} />
        <Route path="/loja" component={Loja} />
        <Route path="/perfil" component={Perfil} />
        <Route path="/equipe" component={Equipe} />
        <Route path="/admin/sprints" component={AdminSprints} />
        <Route path="/admin/tarefas" component={AdminTarefas} />
        <Route path="/admin/membros" component={Equipe} />
        <Route path="/admin/loja" component={Loja} />
        <Route path="/apresentacao" component={Apresentacao} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  const token = localStorage.getItem("authToken");
  
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/apresentacao" component={Apresentacao} />
      <Route>
        {token ? <AppRouter /> : <Login />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
