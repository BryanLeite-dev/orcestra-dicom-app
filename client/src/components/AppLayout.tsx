import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Icons as simple SVG components
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const KanbanIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
  </svg>
);

const FeedIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);

const ShopIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const TeamIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const AdminIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const DiCoinIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
  </svg>
);

const FireIcon = ({ color }: { color: string }) => (
  <svg className={`w-4 h-4 ${color}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.58 5-8.03V4c0-.55.45-1 1-1s1 .45 1 1v2c0 .55-.45 1-1 1-2.76 0-5 2.24-5 5 0 3.31 2.69 6 6 6s6-2.69 6-6c0-1.66-.67-3.16-1.76-4.24l1.42-1.42C17.79 8.47 19 10.61 19 13c0 4.97-4.03 9-9 9z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const menuItems = [
  { title: "Dashboard", icon: HomeIcon, path: "/" },
  { title: "Kanban", icon: KanbanIcon, path: "/kanban" },
  { title: "Feed", icon: FeedIcon, path: "/feed" },
  { title: "Loja", icon: ShopIcon, path: "/loja" },
  { title: "Perfil", icon: ProfileIcon, path: "/perfil" },
  { title: "Equipe", icon: TeamIcon, path: "/equipe" },
  { title: "Sobre", icon: InfoIcon, path: "/apresentacao" },
];

const adminMenuItems = [
  { title: "Gerenciar Leads", path: "/leads" },
  { title: "Gerenciar Sprints", path: "/admin/sprints" },
  { title: "Gerenciar Tarefas", path: "/admin/tarefas" },
  { title: "Gerenciar Membros", path: "/admin/membros" },
  { title: "Gerenciar Loja", path: "/admin/loja" },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, loading, logout } = useAuth();
  const { data: stats } = trpc.gamification.myStats.useQuery(undefined, {
    enabled: !!user,
  });

  const getStreakColor = (streak: number) => {
    if (streak >= 5) return "text-blue-500";
    if (streak >= 3) return "text-red-500";
    return "text-orange-500";
  };

  const getLevelBadgeClass = (nivel: string) => {
    switch (nivel) {
      case "virtuoso": return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
      case "maestro": return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white";
      case "coordenador": return "bg-gradient-to-r from-blue-400 to-blue-600 text-white";
      case "assessor": return "bg-gradient-to-r from-green-400 to-green-600 text-white";
      default: return "bg-gray-200 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center space-y-6 max-w-md">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-primary-foreground font-ubuntu">O</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold font-ubuntu text-foreground">
            Orc'estra DiCoM
          </h1>
          <p className="text-muted-foreground">
            Gestão Gamificada de Scrum para a Diretoria de Comunicação e Marketing
          </p>
          
          <Button onClick={() => window.location.href = "/login"} size="lg" className="w-full">
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground font-ubuntu">O</span>
              </div>
              <div>
                <h2 className="font-bold font-ubuntu text-sidebar-foreground">Orc'estra</h2>
                <p className="text-xs text-sidebar-foreground/70">DiCoM Gamificada</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="overflow-y-auto gap-0">
            {/* User Stats Card */}
            {stats && (
              <div className="px-4 py-2">
                <div className="bg-sidebar-accent rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getLevelBadgeClass(stats.nivel || "trainee")}>
                      {stats.levelTitle}
                    </Badge>
                    {(stats.streakAtual || 0) > 0 && (
                      <div className="flex items-center gap-1">
                        <FireIcon color={getStreakColor(stats.streakAtual || 0)} />
                        <span className={`text-sm font-bold ${getStreakColor(stats.streakAtual || 0)}`}>
                          {stats.streakAtual}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-sidebar-foreground/70">
                      <span>XP: {stats.xpTotal}</span>
                      {stats.nextLevelTitle && (
                        <span>{stats.xpToNextLevel} para {stats.nextLevelTitle}</span>
                      )}
                    </div>
                    <Progress value={stats.xpProgress} className="h-2" />
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm">
                    <DiCoinIcon />
                    <span className="font-bold text-yellow-500">{stats.dicoinsSaldo}</span>
                    <span className="text-sidebar-foreground/70">DiCoins</span>
                  </div>
                </div>
              </div>
            )}

            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={location === item.path}>
                        <Link href={item.path}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {(user.role === "admin" || user.role === "director") && (
              <>
                <SidebarGroup>
                  <SidebarGroupLabel>Administração</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {adminMenuItems.map((item) => (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton asChild isActive={location === item.path}>
                            <Link href={item.path}>
                              <AdminIcon />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            )}
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-bold font-ubuntu">
                {menuItems.find(item => item.path === location)?.title || 
                 adminMenuItems.find(item => item.path === location)?.title || 
                 "Orc'estra DiCoM"}
              </h1>
            </div>
          </div>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
