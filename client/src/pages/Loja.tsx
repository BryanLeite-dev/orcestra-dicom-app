import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Categoria = "roupa" | "acessorio" | "ferramenta" | "pet" | "efeito" | "edicao_limitada";

interface ShopItem {
  id: number;
  nome: string;
  descricao: string | null;
  categoria: Categoria;
  precoDc: number;
  raridade: "comum" | "raro" | "epico" | "lendario";
  requerNivel: string;
  imagemUrl: string | null;
}

const categories: { id: Categoria | "all"; label: string; icon: string }[] = [
  { id: "all", label: "Todos", icon: "🏪" },
  { id: "roupa", label: "Roupas", icon: "👕" },
  { id: "acessorio", label: "Acessórios", icon: "👓" },
  { id: "ferramenta", label: "Ferramentas", icon: "💻" },
  { id: "pet", label: "Pets", icon: "🐤" },
  { id: "efeito", label: "Efeitos", icon: "✨" },
  { id: "edicao_limitada", label: "Edição Limitada", icon: "⭐" },
];

const getRaridadeColor = (raridade: string) => {
  switch (raridade) {
    case "comum": return "bg-gray-100 text-gray-800";
    case "raro": return "bg-blue-100 text-blue-800";
    case "epico": return "bg-purple-100 text-purple-800";
    case "lendario": return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getRaridadeLabel = (raridade: string) => {
  switch (raridade) {
    case "comum": return "Comum";
    case "raro": return "Raro";
    case "epico": return "Épico";
    case "lendario": return "Lendário";
    default: return raridade;
  }
};

const DiCoinIcon = () => (
  <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" />
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">D</text>
  </svg>
);

export default function Loja() {
  const [selectedCategory, setSelectedCategory] = useState<Categoria | "all">("all");
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: stats } = trpc.gamification.myStats.useQuery();
  const { data: items, isLoading } = trpc.shop.list.useQuery(
    selectedCategory !== "all" ? { categoria: selectedCategory } : undefined
  );
  const { data: inventory, refetch: refetchInventory } = trpc.shop.myInventory.useQuery();
  
  const buyMutation = trpc.shop.buy.useMutation({
    onSuccess: () => {
      toast.success("Item comprado com sucesso! 🎉");
      refetchInventory();
      setShowConfirmDialog(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const userBalance = stats?.dicoinsSaldo || 0;
  const ownedItemIds = new Set(inventory?.map(i => i.itemId) || []);

  const filteredItems = items?.filter(item => {
    if (selectedCategory === "all") return true;
    return item.categoria === selectedCategory;
  }) || [];

  const canBuy = (item: ShopItem) => {
    if (ownedItemIds.has(item.id)) return false;
    if (userBalance < item.precoDc) return false;
    return true;
  };

  const handleBuy = () => {
    if (!selectedItem) return;
    buyMutation.mutate({ itemId: selectedItem.id });
  };

  return (
    <div className="space-y-6">
      {/* Header with balance */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-ubuntu">Loja de Customização</h2>
          <p className="text-muted-foreground">Personalize seu avatar com itens exclusivos</p>
        </div>
        <Card className="px-4 py-2">
          <div className="flex items-center gap-2">
            <DiCoinIcon />
            <span className="text-xl font-bold text-yellow-600">{userBalance}</span>
            <span className="text-sm text-muted-foreground">DiCoins</span>
          </div>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as Categoria | "all")}>
        <TabsList className="flex-wrap h-auto gap-1">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="gap-1">
              <span>{cat.icon}</span>
              <span className="hidden sm:inline">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-lg font-semibold mb-2">Nenhum item disponível</h3>
              <p className="text-muted-foreground">
                Não há itens nesta categoria no momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const owned = ownedItemIds.has(item.id);
                const affordable = userBalance >= item.precoDc;
                
                return (
                  <Card 
                    key={item.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg ${owned ? "opacity-60" : ""}`}
                    onClick={() => {
                      setSelectedItem(item as ShopItem);
                      if (!owned) setShowConfirmDialog(true);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-4xl mb-2">
                        {item.imagemUrl ? (
                          <img src={item.imagemUrl} alt={item.nome} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          categories.find(c => c.id === item.categoria)?.icon || "📦"
                        )}
                      </div>
                      <CardTitle className="text-sm line-clamp-1">{item.nome}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {item.descricao || "Sem descrição"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getRaridadeColor(item.raridade)}>
                          {getRaridadeLabel(item.raridade)}
                        </Badge>
                        {owned && (
                          <Badge variant="secondary">Possui</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <DiCoinIcon />
                          <span className={`font-bold ${affordable ? "text-yellow-600" : "text-destructive"}`}>
                            {item.precoDc}
                          </span>
                        </div>
                        {!owned && (
                          <Button 
                            size="sm" 
                            disabled={!affordable}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item as ShopItem);
                              setShowConfirmDialog(true);
                            }}
                          >
                            Comprar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* My Inventory Section */}
      {inventory && inventory.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold font-ubuntu mb-4">Meu Inventário ({inventory.length} itens)</h3>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {inventory.map((item) => (
              <div 
                key={item.inventoryId}
                className={`aspect-square bg-muted rounded-lg flex items-center justify-center text-2xl border-2 ${item.equipado ? "border-primary" : "border-transparent"}`}
                title={item.nome || "Item"}
              >
                {item.imagemUrl ? (
                  <img src={item.imagemUrl} alt={item.nome || ""} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  categories.find(c => c.id === item.categoria)?.icon || "📦"
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Compra</DialogTitle>
            <DialogDescription>
              Você está prestes a comprar este item.
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-3xl">
                  {selectedItem.imagemUrl ? (
                    <img src={selectedItem.imagemUrl} alt={selectedItem.nome} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    categories.find(c => c.id === selectedItem.categoria)?.icon || "📦"
                  )}
                </div>
                <div>
                  <h4 className="font-bold">{selectedItem.nome}</h4>
                  <p className="text-sm text-muted-foreground">{selectedItem.descricao}</p>
                  <Badge className={getRaridadeColor(selectedItem.raridade)}>
                    {getRaridadeLabel(selectedItem.raridade)}
                  </Badge>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span>Preço:</span>
                  <div className="flex items-center gap-1">
                    <DiCoinIcon />
                    <span className="font-bold text-yellow-600">{selectedItem.precoDc}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span>Seu saldo:</span>
                  <div className="flex items-center gap-1">
                    <DiCoinIcon />
                    <span className="font-bold">{userBalance}</span>
                  </div>
                </div>
                <hr className="my-2" />
                <div className="flex items-center justify-between">
                  <span>Saldo após compra:</span>
                  <div className="flex items-center gap-1">
                    <DiCoinIcon />
                    <span className={`font-bold ${userBalance - selectedItem.precoDc >= 0 ? "text-green-600" : "text-destructive"}`}>
                      {userBalance - selectedItem.precoDc}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBuy} 
              disabled={!selectedItem || !canBuy(selectedItem) || buyMutation.isPending}
            >
              {buyMutation.isPending ? "Comprando..." : "Confirmar Compra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
