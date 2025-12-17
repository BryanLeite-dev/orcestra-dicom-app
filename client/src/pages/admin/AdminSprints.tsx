import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminSprints() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    numeroSprint: 1,
    dataInicio: "",
    dataFim: "",
    meta: "",
  });

  const { data: sprints, isLoading, refetch } = trpc.sprints.list.useQuery();
  
  const createMutation = trpc.sprints.create.useMutation({
    onSuccess: () => {
      toast.success("Sprint criada com sucesso!");
      refetch();
      setIsCreateOpen(false);
      setFormData({ numeroSprint: 1, dataInicio: "", dataFim: "", meta: "" });
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const activateMutation = trpc.sprints.activate.useMutation({
    onSuccess: () => {
      toast.success("Sprint ativada!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteMutation = trpc.sprints.delete.useMutation({
    onSuccess: () => {
      toast.success("Sprint excluída!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!formData.dataInicio || !formData.dataFim) {
      toast.error("Preencha as datas de início e fim");
      return;
    }
    createMutation.mutate(formData);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativa": return <Badge className="bg-green-500">Ativa</Badge>;
      case "concluida": return <Badge variant="secondary">Concluída</Badge>;
      default: return <Badge variant="outline">Planejamento</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-ubuntu">Gerenciar Sprints</h2>
          <p className="text-muted-foreground">Crie e gerencie as sprints semanais</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>+ Nova Sprint</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Sprint</DialogTitle>
              <DialogDescription>
                Defina os detalhes da nova sprint semanal
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="numero">Número da Sprint</Label>
                <Input
                  id="numero"
                  type="number"
                  value={formData.numeroSprint}
                  onChange={(e) => setFormData({ ...formData, numeroSprint: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inicio">Data de Início</Label>
                  <Input
                    id="inicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="fim">Data de Fim</Label>
                  <Input
                    id="fim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="meta">Meta da Sprint (opcional)</Label>
                <Textarea
                  id="meta"
                  placeholder="Descreva a meta principal desta sprint..."
                  value={formData.meta}
                  onChange={(e) => setFormData({ ...formData, meta: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar Sprint"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sprints List */}
      {sprints && sprints.length > 0 ? (
        <div className="space-y-4">
          {sprints.map((sprint) => (
            <Card key={sprint.id} className={sprint.status === "ativa" ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Sprint {sprint.numeroSprint}</CardTitle>
                  {getStatusBadge(sprint.status)}
                </div>
                <CardDescription>
                  {formatDate(sprint.dataInicio)} - {formatDate(sprint.dataFim)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sprint.meta && (
                  <p className="text-sm text-muted-foreground mb-4">
                    <strong>Meta:</strong> {sprint.meta}
                  </p>
                )}
                
                <div className="flex gap-2">
                  {sprint.status !== "ativa" && (
                    <Button
                      size="sm"
                      onClick={() => activateMutation.mutate({ id: sprint.id })}
                      disabled={activateMutation.isPending}
                    >
                      Ativar
                    </Button>
                  )}
                  {sprint.status === "planejamento" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Tem certeza que deseja excluir esta sprint?")) {
                          deleteMutation.mutate({ id: sprint.id });
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      Excluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma Sprint</h3>
            <p className="text-muted-foreground mb-4">
              Crie a primeira sprint para começar a gerenciar as tarefas.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              Criar Primeira Sprint
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
