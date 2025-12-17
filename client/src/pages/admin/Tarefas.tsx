import { useState } from "react";
import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function TarefasAdmin() {
  const { user } = useAuth();
  const isDirector = user?.role === "admin" || user?.role === "director";
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
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

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const utils = trpc.useUtils();
        const result = await utils.users.list.fetch();
        setAllUsers(result || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Erro ao carregar membros");
      }
    };
    
    fetchUsers();
  }, []);

  const createMutation = trpc.tarefas.create.useMutation({
    onSuccess: () => {
      toast.success("Tarefa criada com sucesso!");
      refetch();
      setIsCreateOpen(false);
      setSelectedMembers([]);
      setFormData({ titulo: "", descricao: "", pontosXp: "10", prazo: "", tags: "" });
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

  const assignMembersMutation = trpc.tarefas.assignMembers.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Membros atribuídos com sucesso!");
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

  const handleCreate = () => {
    if (!currentSprint) {
      toast.error("Nenhuma sprint ativa!");
      return;
    }
    
    if (!formData.titulo) {
      toast.error("Título é obrigatório");
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
    });
  };

  const handleEditOpen = (task: any) => {
    setSelectedTask(task);
    setSelectedMembers(task.members?.map((m: any) => m.id) || []);
    setIsEditOpen(true);
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
    const colors: { [key: string]: string } = {
      todo: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      review: "bg-yellow-100 text-yellow-800",
      done: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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
        <p className="text-muted-foreground text-center max-w-md">Ative uma sprint para gerenciar tarefas.</p>
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
                    {task.descricao && <p className="text-sm text-muted-foreground mt-1">{task.descricao}</p>}
                  </div>
                  <Badge className={getStatusColor(task.status)}>{getStatusLabel(task.status)}</Badge>
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
                    <p>{task.tags?.join(", ") || "-"}</p>
                  </div>
                </div>

                {task.members && task.members.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">👥 Atribuído para:</p>
                    <div className="flex flex-wrap gap-2">
                      {task.members.map((member: any) => (
                        <Badge key={member.id} variant="secondary" className="text-xs">
                          {member.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {isDirector && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => handleEditOpen(task)}>
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm("Tem certeza que quer deletar esta tarefa?")) {
                          deleteMutation.mutate({ id: task.id });
                        }
                      }}
                    >
                      Deletar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="create-titulo" className="text-sm font-medium">Título *</label>
              <Input
                id="create-titulo"
                placeholder="Ex: Implementar login"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="create-descricao" className="text-sm font-medium">Descrição</label>
              <Textarea
                id="create-descricao"
                placeholder="Descreva a tarefa"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="create-xp" className="text-sm font-medium">Pontos XP</label>
                <Input
                  id="create-xp"
                  type="number"
                  value={formData.pontosXp}
                  onChange={(e) => setFormData({ ...formData, pontosXp: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="create-prazo" className="text-sm font-medium">Prazo</label>
                <Input
                  id="create-prazo"
                  type="date"
                  value={formData.prazo}
                  onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="create-tags" className="text-sm font-medium">Tags</label>
              <Input
                id="create-tags"
                placeholder="Ex: frontend, importante"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            {/* Members Selection */}
            <div className="border-t pt-4">
              <label className="text-sm font-medium block mb-3">👥 Designar Membros</label>
              {allUsers.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50 rounded-lg max-h-48 overflow-y-auto">
                  {allUsers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`create-member-${member.id}`}
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMembers([...selectedMembers, member.id]);
                          } else {
                            setSelectedMembers(selectedMembers.filter((id) => id !== member.id));
                          }
                        }}
                      />
                      <label htmlFor={`create-member-${member.id}`} className="text-sm cursor-pointer">
                        {member.name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-gray-100 rounded">Nenhum membro disponível</p>
              )}
              {selectedMembers.length > 0 && (
                <p className="text-xs text-blue-600 mt-2">✓ {selectedMembers.length} membro(s) selecionado(s)</p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-titulo" className="text-sm font-medium">Título</label>
                <Input
                  id="edit-titulo"
                  value={selectedTask.titulo}
                  onChange={(e) => setSelectedTask({ ...selectedTask, titulo: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="edit-descricao" className="text-sm font-medium">Descrição</label>
                <Textarea
                  id="edit-descricao"
                  value={selectedTask.descricao || ""}
                  onChange={(e) => setSelectedTask({ ...selectedTask, descricao: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-xp" className="text-sm font-medium">Pontos XP</label>
                  <Input
                    id="edit-xp"
                    type="number"
                    value={selectedTask.pontosXp}
                    onChange={(e) => setSelectedTask({ ...selectedTask, pontosXp: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label htmlFor="edit-prazo" className="text-sm font-medium">Prazo</label>
                  <Input
                    id="edit-prazo"
                    type="date"
                    value={selectedTask.prazo?.split("T")[0] || ""}
                    onChange={(e) => setSelectedTask({ ...selectedTask, prazo: e.target.value })}
                  />
                </div>
              </div>

              {/* Members Selection */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium block mb-3">👥 Designar Membros</label>
                {allUsers.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50 rounded-lg max-h-48 overflow-y-auto">
                    {allUsers.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-member-${member.id}`}
                          checked={selectedMembers.includes(member.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMembers([...selectedMembers, member.id]);
                            } else {
                              setSelectedMembers(selectedMembers.filter((id) => id !== member.id));
                            }
                          }}
                        />
                        <label htmlFor={`edit-member-${member.id}`} className="text-sm cursor-pointer">
                          {member.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground p-3 bg-gray-100 rounded">Nenhum membro disponível</p>
                )}
                {selectedMembers.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">✓ {selectedMembers.length} membro(s) selecionado(s)</p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
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
