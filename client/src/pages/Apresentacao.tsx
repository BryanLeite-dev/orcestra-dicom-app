import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Sample data for visualization
const SAMPLE_DATA = {
  sprints: [
    { numero: 1, tarefasConcluidas: 12, xpTotal: 450, membrosAtivos: 8 },
    { numero: 2, tarefasConcluidas: 15, xpTotal: 580, membrosAtivos: 10 },
    { numero: 3, tarefasConcluidas: 18, xpTotal: 720, membrosAtivos: 12 },
    { numero: 4, tarefasConcluidas: 22, xpTotal: 890, membrosAtivos: 14 },
    { numero: 5, tarefasConcluidas: 25, xpTotal: 1050, membrosAtivos: 15 },
  ],
  coordenadorias: [
    { nome: "Comunicação", cor: "#2EB600", membros: 5, tarefas: 18 },
    { nome: "Estruturação", cor: "#1a7a00", membros: 4, tarefas: 15 },
    { nome: "Valor", cor: "#3dd600", membros: 6, tarefas: 22 },
  ],
  niveis: [
    { nome: "Trainee Orc", minXp: 0, membros: 3 },
    { nome: "Assessor Orc", minXp: 100, membros: 5 },
    { nome: "Coordenador Orc", minXp: 300, membros: 4 },
    { nome: "Maestro Orc", minXp: 600, membros: 2 },
    { nome: "Virtuoso Orc", minXp: 1000, membros: 1 },
  ],
  conquistas: [
    { nome: "Primeira Tarefa", icone: "🎯", desbloqueios: 15 },
    { nome: "Streak de 3", icone: "🔥", desbloqueios: 8 },
    { nome: "Comprador", icone: "🛍️", desbloqueios: 12 },
    { nome: "Colaborador", icone: "🤝", desbloqueios: 6 },
  ],
  topMembros: [
    { nome: "Maria Silva", xp: 1250, nivel: "Virtuoso Orc", streak: 5 },
    { nome: "João Santos", xp: 890, nivel: "Maestro Orc", streak: 4 },
    { nome: "Ana Costa", xp: 720, nivel: "Maestro Orc", streak: 3 },
    { nome: "Pedro Lima", xp: 580, nivel: "Coordenador Orc", streak: 2 },
    { nome: "Carla Souza", xp: 450, nivel: "Coordenador Orc", streak: 3 },
  ],
};

const FEATURES = [
  {
    icon: "📋",
    title: "Gestão de Sprints",
    description: "Organize tarefas em sprints semanais com board Kanban interativo",
  },
  {
    icon: "⭐",
    title: "Sistema de XP",
    description: "Ganhe pontos de experiência ao completar tarefas e suba de nível",
  },
  {
    icon: "💰",
    title: "DiCoins",
    description: "Moeda virtual para comprar itens de customização na loja",
  },
  {
    icon: "🔥",
    title: "Streaks",
    description: "Mantenha entregas consecutivas para bônus especiais",
  },
  {
    icon: "🏆",
    title: "Conquistas",
    description: "Desbloqueie badges exclusivos por marcos alcançados",
  },
  {
    icon: "👕",
    title: "Loja de Avatares",
    description: "Personalize seu avatar com roupas, acessórios e pets",
  },
  {
    icon: "📰",
    title: "Feed Social",
    description: "Acompanhe conquistas da equipe e reaja com emojis",
  },
  {
    icon: "🛡️",
    title: "Proteções",
    description: "Escudo e Segunda Chance para proteger seu progresso",
  },
];

const LEVELS = [
  { name: "Trainee Orc", minXp: 0, color: "bg-gray-400", icon: "🌱" },
  { name: "Assessor Orc", minXp: 100, color: "bg-green-500", icon: "🌿" },
  { name: "Coordenador Orc", minXp: 300, color: "bg-blue-500", icon: "🌳" },
  { name: "Maestro Orc", minXp: 600, color: "bg-yellow-500", icon: "⭐" },
  { name: "Virtuoso Orc", minXp: 1000, color: "bg-purple-500", icon: "👑" },
];

export default function Apresentacao() {
  const [activeTab, setActiveTab] = useState("visao-geral");

  const maxXp = Math.max(...SAMPLE_DATA.topMembros.map(m => m.xp));
  const maxTarefas = Math.max(...SAMPLE_DATA.sprints.map(s => s.tarefasConcluidas));
  const totalMembros = SAMPLE_DATA.niveis.reduce((acc, n) => acc + n.membros, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="relative py-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 -z-10" />
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
            <span className="text-2xl">🎮</span>
            <span className="text-primary font-medium">Gestão Gamificada</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold font-ubuntu mb-4">
            <span className="text-primary">Orc'estra</span> DiCoM
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transforme a gestão de tarefas em uma experiência envolvente com gamificação, 
            níveis, conquistas e recompensas para sua equipe.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Card className="px-6 py-4 text-center">
              <p className="text-3xl font-bold text-primary">{totalMembros}</p>
              <p className="text-sm text-muted-foreground">Membros Ativos</p>
            </Card>
            <Card className="px-6 py-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                {SAMPLE_DATA.sprints.reduce((acc, s) => acc + s.tarefasConcluidas, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Tarefas Concluídas</p>
            </Card>
            <Card className="px-6 py-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {SAMPLE_DATA.sprints.reduce((acc, s) => acc + s.xpTotal, 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">XP Distribuído</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold font-ubuntu text-center mb-8">
          Funcionalidades Principais
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Interactive Data Visualization */}
      <section className="py-12 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold font-ubuntu text-center mb-8">
            Dados e Tendências
          </h2>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
              <TabsTrigger value="sprints">Sprints</TabsTrigger>
              <TabsTrigger value="ranking">Ranking</TabsTrigger>
              <TabsTrigger value="niveis">Níveis</TabsTrigger>
            </TabsList>

            <TabsContent value="visao-geral">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coordenadorias */}
                <Card>
                  <CardHeader>
                    <CardTitle>Coordenadorias</CardTitle>
                    <CardDescription>Distribuição de tarefas por área</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {SAMPLE_DATA.coordenadorias.map((coord, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{coord.nome}</span>
                            <span className="text-muted-foreground">{coord.tarefas} tarefas</span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${(coord.tarefas / 25) * 100}%`,
                                backgroundColor: coord.cor 
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{coord.membros} membros</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Conquistas Populares */}
                <Card>
                  <CardHeader>
                    <CardTitle>Conquistas Populares</CardTitle>
                    <CardDescription>Badges mais desbloqueados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {SAMPLE_DATA.conquistas.map((conquista, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <span className="text-3xl">{conquista.icone}</span>
                          <div>
                            <p className="font-medium text-sm">{conquista.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {conquista.desbloqueios} desbloqueios
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sprints">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução das Sprints</CardTitle>
                  <CardDescription>Progresso ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Simple Bar Chart */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-4">Tarefas Concluídas por Sprint</h4>
                      <div className="flex items-end gap-4 h-48">
                        {SAMPLE_DATA.sprints.map((sprint, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div 
                              className="w-full bg-primary rounded-t-lg transition-all duration-500 hover:bg-primary/80"
                              style={{ height: `${(sprint.tarefasConcluidas / maxTarefas) * 100}%` }}
                            />
                            <span className="text-xs text-muted-foreground">S{sprint.numero}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {SAMPLE_DATA.sprints[SAMPLE_DATA.sprints.length - 1].tarefasConcluidas}
                        </p>
                        <p className="text-xs text-muted-foreground">Última Sprint</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          +{Math.round(((SAMPLE_DATA.sprints[SAMPLE_DATA.sprints.length - 1].tarefasConcluidas - SAMPLE_DATA.sprints[0].tarefasConcluidas) / SAMPLE_DATA.sprints[0].tarefasConcluidas) * 100)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Crescimento</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {Math.round(SAMPLE_DATA.sprints.reduce((acc, s) => acc + s.tarefasConcluidas, 0) / SAMPLE_DATA.sprints.length)}
                        </p>
                        <p className="text-xs text-muted-foreground">Média/Sprint</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ranking">
              <Card>
                <CardHeader>
                  <CardTitle>🏆 Top 5 Membros</CardTitle>
                  <CardDescription>Ranking por XP acumulado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {SAMPLE_DATA.topMembros.map((membro, i) => (
                      <div 
                        key={i} 
                        className={`flex items-center gap-4 p-4 rounded-lg ${
                          i === 0 ? "bg-yellow-50 border border-yellow-200" :
                          i === 1 ? "bg-gray-50 border border-gray-200" :
                          i === 2 ? "bg-amber-50 border border-amber-200" :
                          "bg-muted"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          i === 0 ? "bg-yellow-500" :
                          i === 1 ? "bg-gray-400" :
                          i === 2 ? "bg-amber-600" :
                          "bg-primary"
                        }`}>
                          {i + 1}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{membro.nome}</p>
                            {membro.streak > 0 && (
                              <span className="text-orange-500 text-sm">🔥 {membro.streak}</span>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs">{membro.nivel}</Badge>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">{membro.xp.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">XP</p>
                        </div>
                        
                        <div className="w-32 hidden md:block">
                          <Progress value={(membro.xp / maxXp) * 100} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="niveis">
              <Card>
                <CardHeader>
                  <CardTitle>Sistema de Níveis</CardTitle>
                  <CardDescription>Progressão e distribuição de membros</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Level Progression */}
                    <div className="flex justify-between items-center">
                      {LEVELS.map((level, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <div className={`w-14 h-14 rounded-full ${level.color} flex items-center justify-center text-2xl shadow-lg`}>
                            {level.icon}
                          </div>
                          <p className="text-xs font-medium text-center">{level.name.split(" ")[0]}</p>
                          <p className="text-xs text-muted-foreground">{level.minXp}+ XP</p>
                        </div>
                      ))}
                    </div>

                    {/* Distribution */}
                    <div className="pt-6 border-t">
                      <h4 className="text-sm font-medium mb-4">Distribuição de Membros</h4>
                      <div className="space-y-3">
                        {SAMPLE_DATA.niveis.map((nivel, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <span className="w-32 text-sm">{nivel.nome}</span>
                            <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${LEVELS[i].color} transition-all duration-500 flex items-center justify-end pr-2`}
                                style={{ width: `${(nivel.membros / totalMembros) * 100}%` }}
                              >
                                <span className="text-xs text-white font-bold">{nivel.membros}</span>
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {Math.round((nivel.membros / totalMembros) * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Gamification Elements Showcase */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold font-ubuntu text-center mb-8">
          Elementos de Gamificação
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* XP & Levels */}
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <div className="text-5xl mb-2">⭐</div>
              <CardTitle>Sistema de XP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Ganhe XP ao completar tarefas e suba de nível para desbloquear benefícios.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Coordenador Orc</span>
                  <span className="text-sm text-primary">Maestro Orc</span>
                </div>
                <Progress value={65} className="h-3" />
                <p className="text-xs text-center mt-2 text-muted-foreground">
                  210 XP para o próximo nível
                </p>
              </div>
            </CardContent>
          </Card>

          {/* DiCoins */}
          <Card className="border-yellow-200">
            <CardHeader className="text-center">
              <div className="text-5xl mb-2">💰</div>
              <CardTitle>DiCoins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Moeda virtual para comprar itens exclusivos na loja de customização.
              </p>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-yellow-600">1.250</p>
                <p className="text-sm text-muted-foreground">DiCoins disponíveis</p>
              </div>
              <div className="flex justify-center gap-2">
                <Badge>👕 Roupas</Badge>
                <Badge>🐤 Pets</Badge>
                <Badge>✨ Efeitos</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Streaks */}
          <Card className="border-orange-200">
            <CardHeader className="text-center">
              <div className="text-5xl mb-2">🔥</div>
              <CardTitle>Streaks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Mantenha entregas consecutivas para multiplicar suas recompensas.
              </p>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex justify-center items-center gap-2">
                  <span className="text-4xl font-bold text-orange-500">5</span>
                  <span className="text-sm text-muted-foreground">sprints seguidas</span>
                </div>
                <div className="flex justify-center gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs">
                      ✓
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-ubuntu mb-4">
            Pronto para gamificar sua gestão?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Transforme tarefas em conquistas e motive sua equipe com o Orc'estra DiCoM.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={() => window.location.href = "/"}>
              Acessar Dashboard
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Ver Documentação
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-muted/50 text-center">
        <p className="text-sm text-muted-foreground">
          Orc'estra DiCoM - Gestão Gamificada © 2024
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Desenvolvido para a Diretoria de Comunicação da Orc'estra Gamificação
        </p>
      </footer>
    </div>
  );
}
