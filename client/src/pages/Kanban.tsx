import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type TaskStatus = "todo" | "in_progress" | "review" | "done" | "rejected";

interface Task {
  id: number;
  titulo: string;
  descricao: string | null;
  pontosXp: number;
  prazo: Date | null;
  status: TaskStatus;
  tags: string[] | null;
}

const columns: { id: TaskStatus; title: string; className: string }[] = [
  { id: "todo", title: "A Fazer", className: "kanban-todo" },
  { id: "in_progress", title: "Em Progresso", className: "kanban-progress" },
  { id: "review", title: "Em Revisão", className: "kanban-review" },
  { id: "done", title: "Concluído", className: "kanban-done" },
];

const getNextStatus = (current: TaskStatus): TaskStatus | null => {
  switch (current) {
    case "todo": return "in_progress";
    case "in_progress": return "review";
    case "review": return "done";
    case "rejected": return "in_progress";
    default: return null;
  }
};

const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
  switch (current) {
    case "in_progress": return "todo";
    case "review": return "in_progress";
    default: return null;
  }
};

export default function Kanban() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [isEditingSprint, setIsEditingSprint] = useState(false);
  const [editTaskData, setEditTaskData] = useState<any>(null);
  const [editSprintData, setEditSprintData] = useState<any>(null);
  
  const { data: currentSprint, isLoading: sprintLoading, refetch: refetchSprint } = trpc.sprints.current.useQuery();
  const { data: tasks, isLoading: tasksLoading, refetch } = trpc.tarefas.listBySprint.useQuery(
    { sprintId: currentSprint?.id || 0 },
    { enabled: !!currentSprint }
  );
  
  const updateTaskMutation = trpc.tarefas.update.useMutation({
    onSuccess: () => {
      toast.success("Tarefa atualizada com sucesso!");
      setSelectedTask(null);
      setIsEditingTask(false);
      setEditTaskData(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateSprintMutation = trpc.sprints.update.useMutation({
    onSuccess: () => {
      toast.success("Sprint atualizada com sucesso!");
      setIsEditingSprint(false);
      setEditSprintData(null);
      refetchSprint();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSaveSprint = async () => {
    if (!currentSprint || !editSprintData) return;
    await updateSprintMutation.mutateAsync({
      id: currentSprint.id,
      meta: editSprintData.meta,
    });
  };

  const handleSaveTask = async () => {
    if (!editTaskData || !selectedTask) return;
    await updateTaskMutation.mutateAsync({
      id: selectedTask.id,
      titulo: editTaskData.titulo,
      descricao: editTaskData.descricao,
      pontosXp: editTaskData.pontosXp,
      prazo: editTaskData.prazo ? new Date(editTaskData.prazo).toISOString() : undefined,
      tags: editTaskData.tags ? editTaskData.tags.split(",").map((t: string) => t.trim()) : [],
    });
  };

  const updateStatusMutation = trpc.tarefas.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Tarefa movida com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao mover tarefa: ${error.message}`);
    },
  });

  const moveTask = (taskId: number, newStatus: TaskStatus) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
    setSelectedTask(null);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Sem prazo";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const isOverdue = (date: Date | string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks?.filter((task) => task.status === status) || [];
  };

  if (sprintLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentSprint) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-xl font-bold mb-2">Nenhuma Sprint Ativa</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Não há nenhuma sprint ativa no momento. Aguarde o diretor criar uma nova sprint.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sprint Info */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold font-ubuntu">Sprint {currentSprint.numeroSprint}</h2>
            {isEditingSprint ? (
              <div className="flex gap-1">
                <Input
                  type="text"
                  value={editSprintData?.meta || ""}
                  onChange={(e) => setEditSprintData({ ...editSprintData, meta: e.target.value })}
                  className="w-64"
                  placeholder="Meta da sprint"
                />
                <Button size="sm" onClick={handleSaveSprint} disabled={updateSprintMutation.isPending}>
                  Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingSprint(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <>
                <span className="text-sm text-muted-foreground">{currentSprint.meta}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingSprint(true);
                    setEditSprintData({ meta: currentSprint.meta });
                  }}
                >
                  ✏️ Editar
                </Button>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(currentSprint.dataInicio)} - {formatDate(currentSprint.dataFim)}
          </p>
        </div>
        <Badge variant={currentSprint.status === "ativa" ? "default" : "secondary"}>
          {currentSprint.status === "ativa" ? "Em andamento" : currentSprint.status}
        </Badge>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.id} className={`bg-card rounded-lg border ${column.className}`}>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="secondary">{getTasksByStatus(column.id).length}</Badge>
              </div>
            </div>
            
            <div className="p-2 space-y-2 min-h-[400px]">
              {tasksLoading ? (
                <>
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </>
              ) : (
                getTasksByStatus(column.id).map((task) => (
                  <Card 
                    key={task.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTask(task as Task)}
                  >
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm mb-2 line-clamp-2">{task.titulo}</h4>
                      
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="text-xs">
                          +{task.pontosXp} XP
                        </Badge>
                        <span className={`${isOverdue(task.prazo) && column.id !== "done" ? "text-destructive" : "text-muted-foreground"}`}>
                          {formatDate(task.prazo)}
                        </span>
                      </div>
                      
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
              
              {!tasksLoading && getTasksByStatus(column.id).length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma tarefa
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => {
        setSelectedTask(null);
        setIsEditingTask(false);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{selectedTask?.titulo}</DialogTitle>
                <DialogDescription>
                  {selectedTask?.descricao || "Sem descrição"}
                </DialogDescription>
              </div>
              {!isEditingTask && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingTask(true);
                    setEditTaskData({
                      titulo: selectedTask?.titulo,
                      descricao: selectedTask?.descricao,
                      pontosXp: selectedTask?.pontosXp,
                      prazo: selectedTask?.prazo ? new Date(selectedTask.prazo).toISOString().split('T')[0] : "",
                      tags: selectedTask?.tags?.join(", ") || "",
                    });
                  }}
                >
                  ✏️ Editar
                </Button>
              )}
            </div>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              {isEditingTask ? (
                <>
                  <div>
                    <label className="text-sm text-muted-foreground">Título</label>
                    <Input
                      value={editTaskData.titulo}
                      onChange={(e) => setEditTaskData({ ...editTaskData, titulo: e.target.value })}
                      placeholder="Título da tarefa"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground">Descrição</label>
                    <Textarea
                      value={editTaskData.descricao}
                      onChange={(e) => setEditTaskData({ ...editTaskData, descricao: e.target.value })}
                      placeholder="Descrição da tarefa"
                      className="min-h-24"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Pontos XP</label>
                      <Input
                        type="number"
                        value={editTaskData.pontosXp}
                        onChange={(e) => setEditTaskData({ ...editTaskData, pontosXp: parseInt(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-muted-foreground">Prazo</label>
                      <Input
                        type="date"
                        value={editTaskData.prazo}
                        onChange={(e) => setEditTaskData({ ...editTaskData, prazo: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground">Tags (separadas por vírgula)</label>
                    <Input
                      value={editTaskData.tags}
                      onChange={(e) => setEditTaskData({ ...editTaskData, tags: e.target.value })}
                      placeholder="bug, frontend, urgente"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1"
                      onClick={handleSaveTask}
                      disabled={updateTaskMutation.isPending}
                    >
                      Salvar Mudanças
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsEditingTask(false);
                        setEditTaskData(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Pontos</p>
                      <p className="font-bold text-primary">+{selectedTask.pontosXp} XP</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Prazo</p>
                      <p className={isOverdue(selectedTask.prazo) && selectedTask.status !== "done" ? "text-destructive font-bold" : ""}>
                        {formatDate(selectedTask.prazo)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge>{columns.find(c => c.id === selectedTask.status)?.title}</Badge>
                    </div>
                  </div>

                  {selectedTask.tags && selectedTask.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    {getPrevStatus(selectedTask.status) && (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => moveTask(selectedTask.id, getPrevStatus(selectedTask.status)!)}
                        disabled={updateStatusMutation.isPending}
                      >
                        ← Voltar
                      </Button>
                    )}
                    {getNextStatus(selectedTask.status) && (
                      <Button 
                        className="flex-1"
                        onClick={() => moveTask(selectedTask.id, getNextStatus(selectedTask.status)!)}
                        disabled={updateStatusMutation.isPending}
                      >
                        {selectedTask.status === "in_progress" ? "Enviar para Revisão →" : selectedTask.status === "review" ? "Concluir ✓" : "Iniciar →"}
                      </Button>
                    )}
                    {selectedTask.status === "done" && (
                      <div className="flex-1 text-center py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                        ✓ Tarefa Concluída!
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
