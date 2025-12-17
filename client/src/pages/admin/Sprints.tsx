import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function SprintsAdmin() {
  const { user } = useAuth();
  const isDirector = user?.role === "admin" || user?.role === "director";
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    numeroSprint: "",
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
      setFormData({ numeroSprint: "", dataInicio: "", dataFim: "", meta: "" });
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const updateMutation = trpc.sprints.update.useMutation({
    onSuccess: () => {
      toast.success("Sprint atualizada com sucesso!");
      refetch();
      setIsEditOpen(false);
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const activateMutation = trpc.sprints.activate.useMutation({
    onSuccess: () => {
      toast.success("Sprint ativada com sucesso!");
      refetch();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const deleteMutation = trpc.sprints.delete.useMutation({
    onSuccess: () => {
      toast.success("Sprint deletada com sucesso!");
      refetch();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const handleCreate = () => {
    createMutation.mutate({
      numeroSprint: parseInt(formData.numeroSprint),
      dataInicio: formData.dataInicio,
      dataFim: formData.dataFim,
      meta: formData.meta || undefined,
    });
  };

  const handleUpdate = () => {
    if (!selectedSprint) return;
    updateMutation.mutate({
      id: selectedSprint.id,
      numeroSprint: selectedSprint.numeroSprint,
      dataInicio: selectedSprint.dataInicio.split("T")[0],
      dataFim: selectedSprint.dataFim.split("T")[0],
      meta: selectedSprint.meta,
    });
  };

  const handleFinishSprint = (sprintId: number) => {
    updateMutation.mutate({
      id: sprintId,
      status: "concluida",
    });
  };

  const formatDate = (date: string | Date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planejamento":
        return "bg-yellow-100 text-yellow-800";
      case "ativa":
        return "bg-green-100 text-green-800";
      case "concluida":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-ubuntu">Gerenciar Sprints</h1>
          <p className="text-muted-foreground">Crie, edite e ative sprints</p>
        </div>
        {isDirector && (
          <Button onClick={() => setIsCreateOpen(true)} size="lg">
            + Nova Sprint
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {sprints?.map((sprint) => (
            <Card key={sprint.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sprint {sprint.numeroSprint}</CardTitle>
                    <CardDescription>
                      {formatDate(sprint.dataInicio)} - {formatDate(sprint.dataFim)}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(sprint.status)}>
                    {sprint.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sprint.meta && (
                  <div>
                    <p className="text-sm text-muted-foreground">Meta:</p>
                    <p className="text-sm">{sprint.meta}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  {isDirector && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSprint(sprint);
                          setIsEditOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      {sprint.status === "planejamento" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => activateMutation.mutate({ id: sprint.id })}
                          disabled={activateMutation.isPending}
                        >
                          Ativar
                        </Button>
                      )}
                      {sprint.status === "ativa" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleFinishSprint(sprint.id)}
                          disabled={updateMutation.isPending}
                        >
                          Finalizar
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (window.confirm("Tem certeza?")) {
                            deleteMutation.mutate({ id: sprint.id });
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        Deletar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Sprint</DialogTitle>
            <DialogDescription>Crie uma nova sprint para sua equipe</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Número da Sprint</label>
              <Input
                type="number"
                placeholder="Ex: 1"
                value={formData.numeroSprint}
                onChange={(e) =>
                  setFormData({ ...formData, numeroSprint: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={formData.dataInicio}
                onChange={(e) =>
                  setFormData({ ...formData, dataInicio: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={formData.dataFim}
                onChange={(e) =>
                  setFormData({ ...formData, dataFim: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Meta (opcional)</label>
              <Textarea
                placeholder="Descreva a meta da sprint"
                value={formData.meta}
                onChange={(e) =>
                  setFormData({ ...formData, meta: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  createMutation.isPending ||
                  !formData.numeroSprint ||
                  !formData.dataInicio ||
                  !formData.dataFim
                }
              >
                Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sprint</DialogTitle>
          </DialogHeader>
          {selectedSprint && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Meta</label>
                <Textarea
                  value={selectedSprint.meta || ""}
                  onChange={(e) =>
                    setSelectedSprint({ ...selectedSprint, meta: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
