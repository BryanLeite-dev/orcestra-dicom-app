import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPerformance() {
  const { user } = useAuth();
  const isDirector = user?.role === "admin" || user?.role === "director";

  // Fetch all KPIs
  const { data: overview, isLoading } = trpc.analytics.getDashboardOverview.useQuery(undefined, {
    enabled: isDirector,
  });

  if (!isDirector) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Apenas diretores podem acessar este dashboard</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "atingida":
        return "bg-green-100 text-green-800";
      case "progresso":
        return "bg-blue-100 text-blue-800";
      case "abaixo_meta":
        return "bg-red-100 text-red-800";
      case "acima_meta":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "atingida":
        return "✓ Atingida";
      case "progresso":
        return "◐ Em Progresso";
      case "abaixo_meta":
        return "✗ Abaixo da Meta";
      case "acima_meta":
        return "✗ Acima da Meta";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-ubuntu">Dashboard de Performance</h1>
        <p className="text-muted-foreground">Métricas e KPIs em Tempo Real da DiCoM</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="kpis-primarios">KPIs Primários</TabsTrigger>
          <TabsTrigger value="canais">Por Canal</TabsTrigger>
          <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
        </TabsList>

        {/* ===== VISÃO GERAL ===== */}
        <TabsContent value="visao-geral" className="space-y-6 mt-6">
          {/* NORTHSTAR METRIC */}
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                🎯 NORTHSTAR METRIC
              </CardTitle>
              <CardDescription>Leads Passivos Qualificados Gerados por Mês</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">
                    {overview?.northstar.current} / {overview?.northstar.meta}
                  </span>
                  <Badge className={getStatusColor(overview?.northstar.status || "abaixo_meta")}>
                    {overview?.northstar.percentual}%
                  </Badge>
                </div>
                <Progress value={overview?.northstar.percentual} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* KPIs PRIMÁRIOS - Grid 2x2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CPL */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  💰 CPL (Custo por Lead)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">
                    {overview?.cpl.moeda} {overview?.cpl.current}
                  </span>
                  <Badge className={getStatusColor(overview?.cpl.status || "abaixo_meta")}>
                    Meta: {overview?.cpl.moeda} {overview?.cpl.meta}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {overview?.cpl.status === "atingida" ? "✓ Dentro do orçamento" : "✗ Acima do orçamento"}
                </p>
              </CardContent>
            </Card>

            {/* TAXA DE CONVERSÃO */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  📈 Taxa Conversão Lead → Proposta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">{overview?.conversao.current}%</span>
                  <Badge className={getStatusColor(overview?.conversao.status || "abaixo_meta")}>
                    Meta: {overview?.conversao.meta}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {overview?.conversao.comProposta} de {overview?.conversao.total} leads
                </p>
              </CardContent>
            </Card>

            {/* CASES DOCUMENTADOS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🏆 Cases de Sucesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">{overview?.cases.current}</span>
                  <Badge className={getStatusColor(overview?.cases.status || "abaixo_meta")}>
                    Meta: {overview?.cases.meta}
                  </Badge>
                </div>
                <Progress value={overview?.cases.percentual} className="h-2" />
              </CardContent>
            </Card>

            {/* E-BOOK DOWNLOADS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  📚 E-book Downloads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">{overview?.ebooks.current}</span>
                  <Badge className={getStatusColor(overview?.ebooks.status || "abaixo_meta")}>
                    Meta: {overview?.ebooks.meta}
                  </Badge>
                </div>
                <Progress value={overview?.ebooks.percentual} className="h-2" />
              </CardContent>
            </Card>

            {/* COMUNIDADE EMAIL */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  👥 Comunidade (Email List)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">{overview?.comunidade.current}</span>
                  <Badge className={getStatusColor(overview?.comunidade.status || "abaixo_meta")}>
                    Meta: {overview?.comunidade.meta}
                  </Badge>
                </div>
                <Progress value={overview?.comunidade.percentual} className="h-2" />
              </CardContent>
            </Card>

            {/* ENGAJAMENTO REDES */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  💬 Engajamento Redes Sociais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold">{overview?.engajamento.taxaEngajamento}%</div>
                <div className="text-sm space-y-1">
                  <p>📊 Views: {overview?.engajamento.totalViews}</p>
                  <p>❤️ Engajamentos: {overview?.engajamento.totalEngajamento}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== KPIs PRIMÁRIOS (Detalhado) ===== */}
        <TabsContent value="kpis-primarios" className="space-y-6 mt-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Geração de Leads</CardTitle>
                <CardDescription>Foco: 60% (Marketing Comercial)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Leads Passivos/Mês</span>
                    <Badge>{overview?.northstar.current} / 15</Badge>
                  </div>
                  <Progress value={(overview?.northstar.current || 0) / 15 * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPL (Custo por Lead)</span>
                    <Badge>{overview?.cpl.moeda} {overview?.cpl.current}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Meta: &lt; R$ 50</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Taxa Conversão Lead → Proposta</span>
                    <Badge>{overview?.conversao.current}%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Meta: 50%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Autoridade e Valor</CardTitle>
                <CardDescription>Provar que somos bons</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cases de Sucesso</span>
                    <Badge>{overview?.cases.current} / 5</Badge>
                  </div>
                  <Progress value={(overview?.cases.current || 0) / 5 * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Downloads E-books</span>
                    <Badge>{overview?.ebooks.current} / 100</Badge>
                  </div>
                  <Progress value={(overview?.ebooks.current || 0) / 100 * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Comunidade Email</span>
                    <Badge>{overview?.comunidade.current} / 200</Badge>
                  </div>
                  <Progress value={(overview?.comunidade.current || 0) / 200 * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engajamento</CardTitle>
                <CardDescription>Comunicação Interna e Externa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <p className="mb-2">Taxa de Engajamento Redes Sociais: <span className="font-bold">{overview?.engajamento.taxaEngajamento}%</span></p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• LinkedIn Meta: 5% engagement rate</li>
                    <li>• Instagram Meta: 8% engagement rate</li>
                    <li>• Newsletter Abertura Meta: &gt; 70%</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== POR CANAL ===== */}
        <TabsContent value="canais" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Leads por Canal</CardTitle>
              <CardDescription>Origem dos leads gerados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overview?.leadsCanal.map((canal) => (
                  <div key={canal.canal} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{canal.canal.replace("_", " ")}</span>
                      <Badge>{canal.quantidade} leads ({canal.percentual}%)</Badge>
                    </div>
                    <Progress value={canal.percentual} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recomendações por Canal</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>📊 Analise qual canal tem melhor CPL</p>
              <p>📈 Aumentar investimento no canal com melhor ROI</p>
              <p>📉 Revisar ou pausar canais com baixo desempenho</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== CONTEÚDO ===== */}
        <TabsContent value="conteudo" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho de Conteúdo</CardTitle>
              <CardDescription>Blog, E-books, Videos e Case Studies</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Aqui será exibida uma tabela com:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Título do conteúdo</li>
                <li>Tipo (Blog, E-book, Video, Case)</li>
                <li>Views / Downloads</li>
                <li>Taxa de Engajamento</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            💡 <span className="font-semibold">Dica:</span> Este dashboard é atualizado em tempo real. Use os dados para tomar decisões baseadas em dados (decisões melhores = crescimento sustentável).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
