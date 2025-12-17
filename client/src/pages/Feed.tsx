import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const REACTION_EMOJIS = ["🔥", "💪", "🎉", "👏", "⭐"];

const getEventIcon = (tipo: string) => {
  switch (tipo) {
    case "tarefa_completa": return "✅";
    case "nivel_subiu": return "⬆️";
    case "conquista": return "🏆";
    case "meta_coletiva": return "🎯";
    case "item_comprado": return "🛍️";
    default: return "📌";
  }
};

const getEventMessage = (tipo: string, conteudo: any) => {
  switch (tipo) {
    case "tarefa_completa":
      return `completou a tarefa "${conteudo?.titulo}" (+${conteudo?.pontos || 0} XP)`;
    case "nivel_subiu":
      return `subiu para o nível ${conteudo?.nivel}!`;
    case "conquista":
      return `desbloqueou a conquista "${conteudo?.conquistaNome}"`;
    case "meta_coletiva":
      return `ajudou a atingir a meta: ${conteudo?.descricao}`;
    case "item_comprado":
      return `comprou "${conteudo?.itemNome}" na loja`;
    default:
      return conteudo?.descricao || "realizou uma ação";
  }
};

const formatTimeAgo = (date: Date | string) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return then.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

export default function Feed() {
  const [offset, setOffset] = useState(0);
  const limit = 20;
  
  const { data: events, isLoading, refetch } = trpc.gamification.feed.useQuery({ limit, offset });
  const addReactionMutation = trpc.gamification.addReaction.useMutation({
    onSuccess: (result) => {
      refetch();
      if (result.action === "added") {
        toast.success("Reação adicionada!");
      }
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleReaction = (eventoId: number, emoji: string) => {
    addReactionMutation.mutate({ eventoId, emoji });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 max-w-2xl mx-auto">
        <div className="text-6xl mb-4">📰</div>
        <h2 className="text-xl font-bold mb-2">Feed Vazio</h2>
        <p className="text-muted-foreground text-center">
          Nenhuma atividade registrada ainda. Complete tarefas e desbloqueie conquistas para aparecer aqui!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold font-ubuntu">Feed de Conquistas</h2>
        <p className="text-muted-foreground">Acompanhe as conquistas da equipe DiCoM</p>
      </div>

      {events.map((event) => (
        <Card key={event.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex gap-3">
              {/* Avatar */}
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {event.userName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold">{event.userName}</span>
                    <span className="text-muted-foreground ml-1">
                      {getEventMessage(event.tipo, event.conteudo)}
                    </span>
                  </div>
                  <span className="text-2xl">{getEventIcon(event.tipo)}</span>
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimeAgo(event.timestamp)}
                </p>

                {/* Reactions */}
                <div className="flex items-center gap-2 mt-3">
                  {/* Existing reactions */}
                  {event.reactions && event.reactions.length > 0 && (
                    <div className="flex gap-1">
                      {event.reactions.map((reaction, i) => (
                        <Button
                          key={i}
                          variant="secondary"
                          size="sm"
                          className="h-7 px-2 text-sm"
                          onClick={() => handleReaction(event.id, reaction.emoji)}
                        >
                          {reaction.emoji} {reaction.count}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Add reaction buttons */}
                  <div className="flex gap-1 ml-auto">
                    {REACTION_EMOJIS.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-lg hover:bg-muted"
                        onClick={() => handleReaction(event.id, emoji)}
                        disabled={addReactionMutation.isPending}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Load More */}
      {events.length >= limit && (
        <div className="text-center py-4">
          <Button
            variant="outline"
            onClick={() => setOffset(offset + limit)}
          >
            Carregar mais
          </Button>
        </div>
      )}
    </div>
  );
}
