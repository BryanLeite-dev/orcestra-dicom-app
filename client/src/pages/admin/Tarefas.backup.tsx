import { useState } from "react";
import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function TarefasAdmin() {
  const { user } = useAuth();
  const isDirector = user?.role === "admin" || user?.role === "director";
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({
    sprintId: "",
    titulo: "",
    descricao: "",
    pontosXp: "10",
    prazo: "",
    tags: "",
  });

  const { data: currentSprint } = trpc.sprints.current.useQuery();
  const { data: tasks, isLoading, refetch } = trpc.tarefas.listBySprint.useQuery(
    { sprintId: currentSprint?.id || 0 },
    { enabled: !!currentSprint }
  );

  const { data: users, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = trpc.users.list.useQuery(undefined, {
    enabled: false,
  });

  // Create a stable usersList array for rendering
  const usersList = users && Array.isArray(users) ? users : [];

  const createMutation = trpc.tarefas.create.useMutation({
    onSuccess: () => {
      toast.success("Tarefa criada com sucesso!");
      refetch();
      setIsCreateOpen(false);
      setFormData({
        sprintId: currentSprint?.id.toString() || "",
        titulo: "",
        descricao: "",
        pontosXp: "10",
        prazo: "",
        tags: "",
      });
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const updateMutation = trpc.tarefas.update.useMutation({
    onSuccess: () => {
      toast.success("Tarefa atualizada com sucesso!");
      refetch();
      setIsEditOpen(false);
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const deleteMutation = trpc.tarefas.delete.useMutation({
    onSuccess: () => {
      toast.success("Tarefa deletada com sucesso!");
      refetch();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const assignMembersMutation = trpc.tarefas.assignMembers.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => toast.error(`Erro ao atribuir membros: ${error.message}`),
  });

  // Pre-select members when opening edit dialog
  useEffect(() => {
    if (isEditOpen && selectedTask && selectedTask.members) {
      const memberIds = selectedTask.members
        .filter((m: any) => m.id)
        .map((m: any) => m.id);
      setSelectedMembers(memberIds);
    }
  }, [isEditOpen, selectedTask]);

  // Monitor dialog open/close
  useEffect(() => {
    if (isCreateOpen) {
      // Fetch users when dialog opens
      refetchUsers();
    }
  }, [isCreateOpen, refetchUsers]);

  const handleCreate = () => {
    if (!currentSprint) {
      toast.error("Nenhuma sprint ativa!");
      return;
    }
    
    createMutation.mutate({
      sprintId: currentSprint.id,
      titulo: formData.titulo,
      descricao: formData.descricao || undefined,
      pontosXp: parseInt(formData.pontosXp),
      prazo: formData.prazo ? formData.prazo : undefined,
      tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : undefined,
      memberIds: selectedMembers.length > 0 ? selectedMembers : undefined,
    }, {
      onSuccess: (result) => {
        toast.success("Tarefa criada com sucesso!");
        refetch();
        setIsCreateOpen(false);
        setSelectedMembers([]);
        setFormData({
          sprintId: currentSprint?.id.toString() || "",
          titulo: "",
          descricao: "",
          pontosXp: "10",
          prazo: "",
          tags: "",
        });
      },
    });
  };

  const handleEditOpen = (task: any) => {
    setSelectedTask(task);
    setIsEditOpen(true);
  };

  const handleEditClose = () => {
    setIsEditOpen(false);
    setSelectedMembers([]);
    setSelectedTask(null);
  };

  const handleCreateClose = () => {
    setIsCreateOpen(false);
    setSelectedMembers([]);
    setFormData({
      sprintId: currentSprint?.id.toString() || "",
      titulo: "",
      descricao: "",
      pontosXp: "10",
      prazo: "",
      tags: "",
    });
  };

  const handleUpdate = () => {
    if (!selectedTask) return;
    updateMutation.mutate({
      id: selectedTask.id,
      titulo: selectedTask.titulo,
      descricao: selectedTask.descricao,
      pontosXp: selectedTask.pontosXp,
      prazo: selectedTask.prazo,
      tags: selectedTask.tags,
    }, {
      onSuccess: () => {
        if (selectedMembers.length > 0) {
          assignMembersMutation.mutate({
            tarefaId: selectedTask.id,
            memberIds: selectedMembers,
          }, {
            onSuccess: () => {
              setIsEditOpen(false);
              setSelectedMembers([]);
            },
          });
        } else {
          setIsEditOpen(false);
          setSelectedMembers([]);
        }
      },
    });
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "review":
        return "bg-yellow-100 text-yellow-800";
      case "done":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const map: { [key: string]: string } = {
      todo: "A Fazer",
      in_progress: "Em Progresso",
      review: "Em Revisão",
      done: "Concluído",
      rejected: "Rejeitado",
    };
    return map[status] || status;
  };

  if (!currentSprint) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-xl font-bold mb-2">Nenhuma Sprint Ativa</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Ative uma sprint para gerenciar tarefas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-ubuntu">Gerenciar Tarefas</h1>
          <p className="text-muted-foreground">Sprint {currentSprint.numeroSprint}</p>
        </div>
        {isDirector && (
          <Button onClick={() => setIsCreateOpen(true)} size="lg">
            + Nova Tarefa
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks?.map((task) => (
            <Card key={task.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{task.titulo}</CardTitle>
                    {task.descricao && (
                      <CardDescription className="mt-1">
                        {task.descricao}
                      </CardDescription>
                    )}
                  </div>
                  <Badge className={getStatusColor(task.status)}>
                    {getStatusLabel(task.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pontos</p>
                    <p className="font-bold">+{task.pontosXp} XP</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Prazo</p>
                    <p>{formatDate(task.prazo)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tags</p>
                    <p>
                      {task.tags && task.tags.length > 0
                        ? task.tags.join(", ")
                        : "-"}
                    </p>
                  </div>
                </div>
                {task.members && task.members.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Atribuído para:</p>
                    <div className="flex flex-wrap gap-2">
                      {task.members.map((member: any) => (
                        <Badge key={member.id} variant="secondary" className="text-xs">
                          {member.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  {isDirector && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOpen(task)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (window.confirm("Tem certeza?")) {
                            deleteMutation.mutate({ id: task.id });
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
      <Dialog open={isCreateOpen} onOpenChange={handleCreateClose}>
        <DialogContent className="max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
            <DialogDescription>
              Crie uma nova tarefa para Sprint {currentSprint.numeroSprint}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="titulo" className="text-sm font-medium">Título *</label>
              <Input
                id="titulo"
                placeholder="Ex: Implementar login"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="descricao" className="text-sm font-medium">Descrição</label>
              <Textarea
                id="descricao"
                placeholder="Descreva a tarefa"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="pontosXp" className="text-sm font-medium">Pontos XP</label>
                <Input
                  id="pontosXp"
                  type="number"
                  value={formData.pontosXp}
                  onChange={(e) =>
                    setFormData({ ...formData, pontosXp: e.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="prazo" className="text-sm font-medium">Prazo</label>
                <Input
                  id="prazo"
                  type="date"
                  value={formData.prazo}
                  onChange={(e) =>
                    setFormData({ ...formData, prazo: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label htmlFor="tags" className="text-sm font-medium">Tags (separadas por vírgula)</label>
              <Input
                id="tags"
                placeholder="Ex: frontend, importante"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
              />
            </div>
            <div className="border-t pt-4 mt-6">
              <label className="text-sm font-medium block mb-3">👥 Designar Membros do Time:</label>
              {usersList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-48 overflow-y-auto">
                  {usersList.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-blue-100 rounded transition">
                      <Checkbox
                        id={`create-user-${user.id}`}
                        checked={selectedMembers.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMembers([...selectedMembers, user.id]);
                          } else {
                            setSelectedMembers(
                              selectedMembers.filter((id) => id !== user.id)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`create-user-${user.id}`}
                        className="text-sm cursor-pointer font-medium flex-1"
                      >
                        {user.name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-muted-foreground">
                    {usersLoading ? "⏳ Carregando membros do time..." : usersError ? `❌ Erro ao carregar membros: ${usersError.message}` : "ℹ️ Nenhum membro disponível"}
                  </p>
                </div>
              )}
              {selectedMembers.length > 0 && (
                <p className="text-xs text-blue-600 mt-3 font-medium">
                  ✓ {selectedMembers.length} membro(s) selecionado(s)
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t mt-6">
              <Button
                variant="outline"
                onClick={handleCreateClose}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !formData.titulo}
              >
                Criar Tarefa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={handleEditClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
              <div>
                <label htmlFor="edit-titulo" className="text-sm font-medium">Título</label>
                <Input
                  id="edit-titulo"
                  value={selectedTask.titulo}
                  onChange={(e) =>
                    setSelectedTask({
                      ...selectedTask,
                      titulo: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label htmlFor="edit-descricao" className="text-sm font-medium">Descrição</label>
                <Textarea
                  id="edit-descricao"
                  value={selectedTask.descricao || ""}
                  onChange={(e) =>
                    setSelectedTask({
                      ...selectedTask,
                      descricao: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-pontosXp" className="text-sm font-medium">Pontos XP</label>
                  <Input
                    id="edit-pontosXp"
                    type="number"
                    value={selectedTask.pontosXp}
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        pontosXp: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label htmlFor="edit-prazo" className="text-sm font-medium">Prazo</label>
                  <Input
                    id="edit-prazo"
                    type="date"
                    value={selectedTask.prazo?.split("T")[0] || ""}
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        prazo: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Atribuir para:</label>
                <div className="grid grid-cols-2 gap-2 mt-2 border rounded-md p-3 bg-blue-50 max-h-48 overflow-y-auto">
                  {usersList.length > 0 ? (
                    usersList.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-user-${user.id}`}
                          checked={selectedMembers.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMembers([...selectedMembers, user.id]);
                            } else {
                              setSelectedMembers(
                                selectedMembers.filter((id) => id !== user.id)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`edit-user-${user.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {user.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-2 text-xs text-muted-foreground text-center py-2">
                      {usersLoading ? "⏳ Carregando..." : "Nenhum membro disponível"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleEditClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
