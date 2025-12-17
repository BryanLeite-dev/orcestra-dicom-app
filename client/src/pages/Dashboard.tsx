import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

// Icons
const TaskIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const DiCoinIcon = () => (
  <svg className="w-6 h-6 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">D</text>
  </svg>
);

const FireIcon = ({ size = "w-5 h-5", color = "text-orange-500" }: { size?: string; color?: string }) => (
  <svg className={`${size} ${color}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.58 5-8.03V4c0-.55.45-1 1-1s1 .45 1 1v2c0 .55-.45 1-1 1-2.76 0-5 2.24-5 5 0 3.31 2.69 6 6 6s6-2.69 6-6c0-1.66-.67-3.16-1.76-4.24l1.42-1.42C17.79 8.47 19 10.61 19 13c0 4.97-4.03 9-9 9z" />
  </svg>
);

const getStatusColor = (status: string) => {
  switch (status) {
    case "todo": return "bg-blue-100 text-blue-800";
    case "in_progress": return "bg-yellow-100 text-yellow-800";
    case "review": return "bg-purple-100 text-purple-800";
    case "done": return "bg-green-100 text-green-800";
    case "rejected": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "todo": return "A Fazer";
    case "in_progress": return "Em Progresso";
    case "review": return "Em Revisão";
    case "done": return "Concluída";
    case "rejected": return "Rejeitada";
    default: return status;
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.gamification.myStats.useQuery();
  const { data: currentSprint, isLoading: sprintLoading } = trpc.sprints.current.useQuery();
  const { data: myConquistas } = trpc.gamification.myConquistas.useQuery();
  const { data: feed } = trpc.gamification.feed.useQuery({ limit: 5 });

  const getStreakColor = (streak: number) => {
    if (streak >= 5) return "text-blue-500";
    if (streak >= 3) return "text-red-500";
    return "text-orange-500";
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const getDaysRemaining = (endDate: Date | string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-ubuntu">
            Olá, {user?.name?.split(" ")[0] || "Orc"}! 👋
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta à DiCoM Gamificada
          </p>
        </div>
        {stats && (stats.streakAtual || 0) > 0 && (
          <div className="flex items-center gap-2 bg-card rounded-lg px-4 py-2 border">
            <FireIcon color={getStreakColor(stats.streakAtual || 0)} />
            <span className={`text-xl font-bold ${getStreakColor(stats.streakAtual || 0)}`}>
              {stats.streakAtual}
            </span>
            <span className="text-sm text-muted-foreground">sprints</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* XP Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Experiência Total</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {statsLoading ? <Skeleton className="h-9 w-24" /> : `${stats?.xpTotal || 0} XP`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{stats.levelTitle}</span>
                  {stats.nextLevelTitle && (
                    <span className="text-primary">{stats.nextLevelTitle}</span>
                  )}
                </div>
                <Progress value={stats.xpProgress} className="h-2" />
                {stats.nextLevelTitle && (
                  <p className="text-xs text-muted-foreground">
                    {stats.xpToNextLevel} XP para o próximo nível
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DiCoins Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo de DiCoins</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <DiCoinIcon />
              {statsLoading ? <Skeleton className="h-9 w-20" /> : stats?.dicoinsSaldo || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/loja" className="text-sm text-primary hover:underline">
              Visitar a Loja →
            </Link>
          </CardContent>
        </Card>

        {/* Sprint Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sprint Atual</CardDescription>
            <CardTitle className="text-xl font-bold">
              {sprintLoading ? (
                <Skeleton className="h-7 w-32" />
              ) : currentSprint ? (
                `Sprint ${currentSprint.numeroSprint}`
              ) : (
                "Nenhuma sprint ativa"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentSprint && (
              <div className="flex items-center gap-2">
                <CalendarIcon />
                <span className="text-sm text-muted-foreground">
                  {getDaysRemaining(currentSprint.dataFim)} dias restantes
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conquistas Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conquistas</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <TrophyIcon />
              {myConquistas?.length || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/perfil" className="text-sm text-primary hover:underline">
              Ver todas →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sprint Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TaskIcon />
              Progresso da Sprint
            </CardTitle>
            <CardDescription>
              {currentSprint 
                ? `${formatDate(currentSprint.dataInicio)} - ${formatDate(currentSprint.dataFim)}`
                : "Nenhuma sprint ativa no momento"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentSprint ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">XP desta sprint</span>
                  <span className="text-lg font-bold text-primary">
                    +{stats?.xpSprintAtual || 0} XP
                  </span>
                </div>
                
                {currentSprint.meta && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Meta da Sprint:</p>
                    <p className="text-muted-foreground">{currentSprint.meta}</p>
                  </div>
                )}

                <Link 
                  href="/kanban" 
                  className="block w-full text-center py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Ver Minhas Tarefas
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aguardando início de uma nova sprint</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas conquistas da equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feed && feed.length > 0 ? (
                feed.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                      {event.userName?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.tipo === "tarefa_completa" && `Completou: ${event.conteudo?.titulo}`}
                        {event.tipo === "nivel_subiu" && `Subiu para ${event.conteudo?.nivel}`}
                        {event.tipo === "conquista" && `Desbloqueou: ${event.conteudo?.conquistaNome}`}
                        {event.tipo === "item_comprado" && `Comprou: ${event.conteudo?.itemNome}`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
            
            <Link 
              href="/feed" 
              className="block text-center text-sm text-primary hover:underline mt-4"
            >
              Ver todo o feed →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Protection Items */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className={stats.temEscudo ? "border-primary" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">🛡️ Escudo de Proteção</CardTitle>
                {stats.temEscudo ? (
                  <Badge className="bg-primary">Ativo</Badge>
                ) : (
                  <Badge variant="outline">Não possui</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats.temEscudo 
                  ? "Você está protegido! Se perder uma entrega, manterá 50% dos DiCoins e seu Streak."
                  : "Compre por 500 DiCoins na loja para se proteger contra perdas."
                }
              </p>
            </CardContent>
          </Card>

          <Card className={stats.segundaChanceDisponivel ? "border-green-500" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">🆘 Segunda Chance</CardTitle>
                {stats.segundaChanceDisponivel ? (
                  <Badge className="bg-green-500">Disponível</Badge>
                ) : (
                  <Badge variant="outline">Usada este mês</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats.segundaChanceDisponivel 
                  ? "Você pode usar 1x por mês para estender um prazo sem penalidade."
                  : "Você já usou sua segunda chance este mês. Renova no próximo mês."
                }
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
