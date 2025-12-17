import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const LEVELS = [
  { name: "trainee", title: "Trainee Orc", color: "bg-gray-400" },
  { name: "assessor", title: "Assessor Orc", color: "bg-green-500" },
  { name: "coordenador", title: "Coordenador Orc", color: "bg-blue-500" },
  { name: "maestro", title: "Maestro Orc", color: "bg-yellow-500" },
  { name: "virtuoso", title: "Virtuoso Orc", color: "bg-purple-500" },
];

const getLevelInfo = (nivel: string) => {
  return LEVELS.find(l => l.name === nivel) || LEVELS[0];
};

const FireIcon = ({ color }: { color: string }) => (
  <svg className={`w-4 h-4 ${color}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.58 5-8.03V4c0-.55.45-1 1-1s1 .45 1 1v2c0 .55-.45 1-1 1-2.76 0-5 2.24-5 5 0 3.31 2.69 6 6 6s6-2.69 6-6c0-1.66-.67-3.16-1.76-4.24l1.42-1.42C17.79 8.47 19 10.61 19 13c0 4.97-4.03 9-9 9z" />
  </svg>
);

const getStreakColor = (streak: number) => {
  if (streak >= 5) return "text-blue-500";
  if (streak >= 3) return "text-red-500";
  return "text-orange-500";
};

export default function Equipe() {
  const { data: leaderboard, isLoading: leaderboardLoading } = trpc.gamification.leaderboard.useQuery();
  const { data: coordenadorias, isLoading: coordsLoading } = trpc.coordenadorias.list.useQuery();

  if (leaderboardLoading || coordsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Ranking de XP
          </CardTitle>
          <CardDescription>Os Orcs mais dedicados da DiCoM</CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((member, index) => {
                const levelInfo = getLevelInfo(member.nivel || "trainee");
                const isTop3 = index < 3;
                
                return (
                  <div 
                    key={member.id}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      isTop3 ? "bg-muted" : ""
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? "bg-yellow-400 text-yellow-900" :
                      index === 1 ? "bg-gray-300 text-gray-700" :
                      index === 2 ? "bg-amber-600 text-white" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`${levelInfo.color} text-white`}>
                        {member.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{member.name}</p>
                        {(member.streakAtual || 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <FireIcon color={getStreakColor(member.streakAtual || 0)} />
                            <span className={`text-xs font-bold ${getStreakColor(member.streakAtual || 0)}`}>
                              {member.streakAtual}
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {levelInfo.title}
                      </Badge>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <p className="font-bold text-primary">{member.xpTotal}</p>
                      <p className="text-xs text-muted-foreground">XP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum membro encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coordenadorias */}
      <div>
        <h2 className="text-xl font-bold font-ubuntu mb-4">Coordenadorias</h2>
        
        {coordenadorias && coordenadorias.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coordenadorias.map((coord) => (
              <Card key={coord.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{coord.icone || "📁"}</span>
                    <CardTitle className="text-lg">{coord.nome}</CardTitle>
                  </div>
                  <CardDescription>{coord.descricao || "Sem descrição"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="h-2 rounded-full mb-2"
                    style={{ backgroundColor: coord.corTema || "#2EB600" }}
                  />
                  <p className="text-sm text-muted-foreground">
                    Criada em {new Date(coord.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma coordenadoria cadastrada
            </CardContent>
          </Card>
        )}
      </div>

      {/* Team Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas da Equipe</CardTitle>
          <CardDescription>Visão geral do desempenho coletivo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-primary">
                {leaderboard?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Membros</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {leaderboard?.reduce((acc, m) => acc + (m.xpTotal || 0), 0) || 0}
              </p>
              <p className="text-sm text-muted-foreground">XP Total</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-orange-500">
                {leaderboard?.filter(m => (m.streakAtual || 0) > 0).length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Com Streak</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-purple-600">
                {coordenadorias?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Coordenadorias</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Nível</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {LEVELS.map((level) => {
              const count = leaderboard?.filter(m => m.nivel === level.name).length || 0;
              const percentage = leaderboard?.length ? (count / leaderboard.length) * 100 : 0;
              
              return (
                <div key={level.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{level.title}</span>
                    <span className="text-muted-foreground">{count} membros</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
