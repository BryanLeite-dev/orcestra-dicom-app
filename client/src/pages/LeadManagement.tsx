import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

export default function LeadManagement() {
  const { user } = useAuth();
  const isDirector = user?.role === "admin" || user?.role === "director";

  // State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>(""); 
  const [filterCanal, setFilterCanal] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cargo: "",
    telefone: "",
    empresa: "",
    origem: "direto",
    necessidade: "",
  });

  // Queries
  const { data: leads, isLoading, refetch } = trpc.analytics.getLeads.useQuery(
    { page: 1, limit: 100, status: filterStatus || undefined, canal: filterCanal || undefined },
    { enabled: isDirector }
  );

  // Mutations
  const createLeadMutation = trpc.analytics.createLeadFromEmail.useMutation({
    onSuccess: (result) => {
      if (!result) {
        toast.error("Resposta inválida do servidor");
        return;
      }
      toast.success(result.message);
      refetch();
      setIsCreateOpen(false);
      setFormData({
        nome: "",
        email: "",
        cargo: "",
        telefone: "",
        empresa: "",
        origem: "direto",
        necessidade: "",
      });
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const updateStatusMutation = trpc.analytics.updateLeadStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado");
      refetch();
      setSelectedLead(null);
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  if (!isDirector) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Apenas diretores podem gerenciar leads</p>
      </div>
    );
  }

  const handleCreateLead = () => {
    if (!formData.nome || !formData.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    createLeadMutation.mutate({
      nome: formData.nome,
      email: formData.email,
      cargo: formData.cargo,
      telefone: formData.telefone,
      empresa: formData.empresa,
      origem: formData.origem,
      necessidade: formData.necessidade,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "prospecto":
        return "bg-blue-100 text-blue-800";
      case "qualificado":
        return "bg-yellow-100 text-yellow-800";
      case "proposta":
        return "bg-purple-100 text-purple-800";
      case "cliente":
        return "bg-green-100 text-green-800";
      case "perdido":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const map: { [key: string]: string } = {
      prospecto: "Prospecto",
      qualificado: "Qualificado",
      proposta: "Proposta",
      cliente: "Cliente",
      perdido: "Perdido",
    };
    return map[status] || status;
  };

  const getOrigemLabel = (origem: string) => {
    const map: { [key: string]: string } = {
      google_ads: "Google Ads",
      linkedin: "LinkedIn",
      instagram: "Instagram",
      ebook: "E-book",
      organico_linkedin: "Orgânico LinkedIn",
      referral: "Indicação",
      direto: "Direto",
    };
    return map[origem] || origem;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-ubuntu">Gerenciar Leads</h1>
          <p className="text-muted-foreground">Receba e qualifique leads automaticamente</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="lg">
          + Novo Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-2">Filtrar por Status</label>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospecto">Prospecto</SelectItem>
                <SelectItem value="qualificado">Qualificado</SelectItem>
                <SelectItem value="proposta">Proposta</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
            {filterStatus && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterStatus("")}
                className="px-3"
              >
                ✕
              </Button>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Filtrar por Canal</label>
          <div className="flex gap-2">
            <Select value={filterCanal} onValueChange={setFilterCanal}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Todos os canais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google_ads">Google Ads</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="ebook">E-book</SelectItem>
              <SelectItem value="organico_linkedin">Orgânico LinkedIn</SelectItem>
              <SelectItem value="referral">Indicação</SelectItem>
              <SelectItem value="direto">Direto</SelectItem>
            </SelectContent>
            </Select>
            {filterCanal && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterCanal("")}
                className="px-3"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Leads List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : leads && leads.items.length > 0 ? (
        <div className="space-y-4">
          {leads.items.map((lead: any) => (
            <Card key={lead.id} className="hover:shadow-lg transition">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold">{lead.nome}</h3>
                      <Badge className={getStatusColor(lead.status)}>
                        {getStatusLabel(lead.status)}
                      </Badge>
                      <Badge variant="outline">{getOrigemLabel(lead.origem)}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                          {lead.email}
                        </a>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Telefone</p>
                        <p className="font-medium">{lead.telefone || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cargo</p>
                        <p className="font-medium">{lead.cargo || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Empresa</p>
                        <p className="font-medium">{lead.empresa || "-"}</p>
                      </div>
                    </div>

                    {lead.observacoes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                        <p className="font-medium text-blue-900">Necessidade:</p>
                        <p className="text-blue-800">{lead.observacoes}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Capturado em {new Date(lead.dataCaptura).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <Button
                    onClick={() => setSelectedLead(lead)}
                    className="shrink-0"
                  >
                    Editar Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold mb-2">Nenhum lead encontrado</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Comece adicionando leads manualmente ou configure sua integração de email
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Lead Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="nome" className="text-sm font-medium">
                Qual o seu nome? *
              </label>
              <Input
                id="nome"
                placeholder="Ex: Gustavo Macedo de Carvalho"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Qual seu melhor e-mail? *
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Ex: gustavo@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cargo" className="text-sm font-medium">
                  Qual seu cargo?
                </label>
                <Input
                  id="cargo"
                  placeholder="Ex: CEO/Sócio/Diretor"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="telefone" className="text-sm font-medium">
                  Qual seu telefone?
                </label>
                <Input
                  id="telefone"
                  placeholder="Ex: (61) 99294-9999"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="empresa" className="text-sm font-medium">
                Empresa
              </label>
              <Input
                id="empresa"
                placeholder="Ex: Acme Corporation"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="origem" className="text-sm font-medium">
                Por onde você nos conheceu?
              </label>
              <Select value={formData.origem} onValueChange={(value) => setFormData({ ...formData, origem: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direto">Direto</SelectItem>
                  <SelectItem value="referral">Indicação</SelectItem>
                  <SelectItem value="google_ads">Google Ads</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="ebook">E-book</SelectItem>
                  <SelectItem value="organico_linkedin">Orgânico LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="necessidade" className="text-sm font-medium">
                Nos conte um pouco sobre sua necessidade
              </label>
              <Textarea
                id="necessidade"
                placeholder="Ex: Gostaria de melhorar a gamificação de um app..."
                value={formData.necessidade}
                onChange={(e) => setFormData({ ...formData, necessidade: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateLead} disabled={createLeadMutation.isPending}>
                {createLeadMutation.isPending ? "Salvando..." : "Salvar Lead"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atualizar Status - {selectedLead.nome}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Novo Status</label>
                <Select
                  defaultValue={selectedLead.status}
                  onValueChange={(value) => {
                    updateStatusMutation.mutate({
                      leadId: selectedLead.id,
                      novoStatus: value,
                      observacoes: selectedLead.observacoes,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospecto">Prospecto</SelectItem>
                    <SelectItem value="qualificado">Qualificado</SelectItem>
                    <SelectItem value="proposta">Proposta</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            💡 Como funciona a integração de email?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>Opção 1 (Manual):</strong> Use o formulário acima para adicionar leads manualmente quando receber emails.
          </p>
          <p>
            <strong>Opção 2 (Automática):</strong> Configure um webhook em sua plataforma de email (Mailchimp, Zapier, etc) para enviar dados para:
          </p>
          <code className="block bg-white p-2 rounded border mt-2">
            POST /api/webhook/lead
          </code>
          <p className="text-xs mt-2">Enviando JSON com: nome, email, cargo, origem, telefone, necessidade, empresa</p>
        </CardContent>
      </Card>
    </div>
  );
}
