import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const LEVELS = [
  { name: "trainee", title: "Trainee Orc", minXp: 0, color: "bg-gray-400" },
  { name: "assessor", title: "Assessor Orc", minXp: 100, color: "bg-green-500" },
  { name: "coordenador", title: "Coordenador Orc", minXp: 300, color: "bg-blue-500" },
  { name: "maestro", title: "Maestro Orc", minXp: 600, color: "bg-yellow-500" },
  { name: "virtuoso", title: "Virtuoso Orc", minXp: 1000, color: "bg-purple-500" },
];

const getRaridadeBadge = (raridade: string) => {
  switch (raridade) {
    case "bronze": return "badge-bronze text-white";
    case "prata": return "badge-prata text-gray-800";
    case "ouro": return "badge-ouro text-white";
    default: return "bg-gray-200 text-gray-800";
  }
};

const getCategoriaIcon = (categoria: string) => {
  switch (categoria) {
    case "valor": return "💎";
    case "comunicacao": return "📢";
    case "estruturacao": return "🏗️";
    default: return "🏆";
  }
};

const FireIcon = ({ color }: { color: string }) => (
  <svg className={`w-6 h-6 ${color}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.58 5-8.03V4c0-.55.45-1 1-1s1 .45 1 1v2c0 .55-.45 1-1 1-2.76 0-5 2.24-5 5 0 3.31 2.69 6 6 6s6-2.69 6-6c0-1.66-.67-3.16-1.76-4.24l1.42-1.42C17.79 8.47 19 10.61 19 13c0 4.97-4.03 9-9 9z" />
  </svg>
);

const DiCoinIcon = () => (
  <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" />
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">D</text>
  </svg>
);

export default function Perfil() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.gamification.myStats.useQuery();
  const { data: conquistas, isLoading: conquistasLoading } = trpc.gamification.myConquistas.useQuery();
  const { data: transactions } = trpc.gamification.myTransactions.useQuery({ limit: 10 });
  const { data: inventory } = trpc.shop.myInventory.useQuery();

  const getStreakColor = (streak: number) => {
    if (streak >= 5) return "text-blue-500";
    if (streak >= 3) return "text-red-500";
    return "text-orange-500";
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary to-primary/60" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-12">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-primary border-4 border-background flex items-center justify-center text-4xl font-bold text-primary-foreground font-ubuntu">
              {user?.name?.charAt(0) || "O"}
            </div>
            
            <div className="flex-1 text-center md:text-left pb-4">
              <h1 className="text-2xl font-bold font-ubuntu">{user?.name || "Orc"}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <Badge className="bg-primary">{stats?.levelTitle}</Badge>
                {stats && (stats.streakAtual || 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <FireIcon color={getStreakColor(stats.streakAtual || 0)} />
                    <span className={`font-bold ${getStreakColor(stats.streakAtual || 0)}`}>
                      {stats.streakAtual} sprints
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats?.xpTotal || 0}</p>
                <p className="text-xs text-muted-foreground">XP Total</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <DiCoinIcon />
                  <p className="text-2xl font-bold text-yellow-600">{stats?.dicoinsSaldo || 0}</p>
                </div>
                <p className="text-xs text-muted-foreground">DiCoins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{conquistas?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Conquistas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progressão de Nível</CardTitle>
          <CardDescription>Sua jornada como Orc</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current level progress */}
            {stats && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{stats.levelTitle}</span>
                  {stats.nextLevelTitle && (
                    <span className="text-primary">{stats.nextLevelTitle}</span>
                  )}
                </div>
                <Progress value={stats.xpProgress} className="h-3" />
                <p className="text-xs text-muted-foreground text-center">
                  {stats.nextLevelTitle 
                    ? `${stats.xpToNextLevel} XP para o próximo nível`
                    : "Nível máximo atingido! 🎉"
                  }
                </p>
              </div>
            )}

            {/* All levels */}
            <div className="flex justify-between mt-6">
              {LEVELS.map((level, index) => {
                const isCurrentOrPast = stats && (stats.xpTotal || 0) >= level.minXp;
                const isCurrent = stats?.nivel === level.name;
                
                return (
                  <div key={level.name} className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        isCurrentOrPast ? level.color : "bg-gray-200"
                      } ${isCurrent ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                    >
                      {index + 1}
                    </div>
                    <p className={`text-xs mt-1 ${isCurrent ? "font-bold" : "text-muted-foreground"}`}>
                      {level.title.split(" ")[0]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Conquistas, Inventory, Transactions */}
      <Tabs defaultValue="conquistas">
        <TabsList>
          <TabsTrigger value="conquistas">Conquistas ({conquistas?.length || 0})</TabsTrigger>
          <TabsTrigger value="inventario">Inventário ({inventory?.length || 0})</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="conquistas" className="mt-4">
          {conquistasLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : conquistas && conquistas.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {conquistas.map((conquista) => (
                <Card key={conquista.id} className="text-center">
                  <CardContent className="pt-4">
                    <div className="text-4xl mb-2">
                      {conquista.iconeUrl || getCategoriaIcon(conquista.categoria || "")}
                    </div>
                    <h4 className="font-semibold text-sm line-clamp-1">{conquista.nome}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {conquista.descricao}
                    </p>
                    <Badge className={`mt-2 ${getRaridadeBadge(conquista.raridade || "bronze")}`}>
                      {conquista.raridade}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {conquista.dataDesbloqueio && formatDate(conquista.dataDesbloqueio)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma conquista ainda</h3>
              <p className="text-muted-foreground">
                Complete tarefas e desafios para desbloquear conquistas!
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventario" className="mt-4">
          {inventory && inventory.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {inventory.map((item) => (
                <Card 
                  key={item.inventoryId} 
                  className={`text-center ${item.equipado ? "ring-2 ring-primary" : ""}`}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-2xl mb-2">
                      {item.imagemUrl ? (
                        <img src={item.imagemUrl} alt={item.nome || ""} className="w-full h-full object-cover rounded-lg" />
                      ) : "📦"}
                    </div>
                    <p className="text-xs font-medium line-clamp-1">{item.nome}</p>
                    {item.equipado && (
                      <Badge variant="secondary" className="text-xs mt-1">Equipado</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛍️</div>
              <h3 className="text-lg font-semibold mb-2">Inventário vazio</h3>
              <p className="text-muted-foreground">
                Visite a loja para comprar itens de customização!
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          {transactions && transactions.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.tipo === "ganho" ? "bg-green-100 text-green-600" :
                          tx.tipo === "gasto" ? "bg-blue-100 text-blue-600" :
                          "bg-red-100 text-red-600"
                        }`}>
                          {tx.tipo === "ganho" ? "+" : tx.tipo === "gasto" ? "🛒" : "-"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tx.motivo}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(tx.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 font-bold ${
                        tx.tipo === "ganho" ? "text-green-600" : 
                        tx.tipo === "gasto" ? "text-blue-600" : 
                        "text-red-600"
                      }`}>
                        <DiCoinIcon />
                        {tx.tipo === "ganho" ? "+" : "-"}{tx.valor}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📜</div>
              <h3 className="text-lg font-semibold mb-2">Sem transações</h3>
              <p className="text-muted-foreground">
                Seu histórico de DiCoins aparecerá aqui.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats?.xpTotal || 0}</p>
            <p className="text-sm text-muted-foreground">XP Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats?.dicoinsTotalGanho || 0}</p>
            <p className="text-sm text-muted-foreground">DiCoins Ganhos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats?.dicoinsTotalGasto || 0}</p>
            <p className="text-sm text-muted-foreground">DiCoins Gastos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold">{stats?.streakRecorde || 0}</p>
            <p className="text-sm text-muted-foreground">Streak Recorde</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
