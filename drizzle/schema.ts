import { serial, pgEnum, pgTable, text, timestamp, varchar, boolean, json, integer, decimal } from "drizzle-orm/pg-core";

/**
 * Enums for PostgreSQL
 */
export const roleEnum = pgEnum("role", ["user", "admin", "director"]);
export const nivelEnum = pgEnum("nivel", ["trainee", "assessor", "coordenador", "maestro", "virtuoso"]);
export const sprintStatusEnum = pgEnum("sprint_status", ["planejamento", "ativa", "concluida"]);
export const tarefaStatusEnum = pgEnum("tarefa_status", ["todo", "in_progress", "review", "done", "rejected"]);
export const conquistaCategoriaEnum = pgEnum("conquista_categoria", ["valor", "comunicacao", "estruturacao"]);
export const conquistaRaridadeEnum = pgEnum("conquista_raridade", ["bronze", "prata", "ouro"]);
export const shopItemCategoriaEnum = pgEnum("shop_item_categoria", ["roupa", "acessorio", "ferramenta", "pet", "efeito", "edicao_limitada"]);
export const shopItemRaridadeEnum = pgEnum("shop_item_raridade", ["comum", "raro", "epico", "lendario"]);
export const dicoinTipoEnum = pgEnum("dicoin_tipo", ["ganho", "gasto", "perda"]);
export const feedEventoTipoEnum = pgEnum("feed_evento_tipo", ["tarefa_completa", "nivel_subiu", "conquista", "meta_coletiva", "item_comprado"]);
export const leadStatusEnum = pgEnum("lead_status", ["prospecto", "qualificado", "proposta", "cliente", "perdido"]);
export const canalOrigemEnum = pgEnum("canal_origem", ["google_ads", "linkedin", "instagram", "ebook", "organico_linkedin", "referral", "direto"]);
export const tipoCampanhaEnum = pgEnum("tipo_campanha", ["google_ads", "linkedin", "email", "ebook", "evento", "organico"]);

/**
 * Core user table backing auth flow.
 * Extended with gamification fields for Orc'estra DiCoM app.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 128 }).unique(),
  googleId: varchar("googleId", { length: 128 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  
  // Gamification fields
  coordenadoriaId: integer("coordenadoriaId"),
  nivel: nivelEnum("nivel").default("trainee"),
  xpTotal: integer("xpTotal").default(0),
  xpSprintAtual: integer("xpSprintAtual").default(0),
  dicoinsSaldo: integer("dicoinsSaldo").default(0),
  dicoinsTotalGanho: integer("dicoinsTotalGanho").default(0),
  dicoinsTotalGasto: integer("dicoinsTotalGasto").default(0),
  streakAtual: integer("streakAtual").default(0),
  streakRecorde: integer("streakRecorde").default(0),
  temEscudo: boolean("temEscudo").default(false),
  segundaChanceDisponivel: boolean("segundaChanceDisponivel").default(true),
  avatarConfig: json("avatarConfig").$type<{
    skinTone?: string;
    hairStyle?: string;
    hairColor?: string;
    equippedItems?: number[];
  }>(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Coordenadorias (departments) table
 */
export const coordenadorias = pgTable("coordenadorias", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull().unique(),
  descricao: text("descricao"),
  icone: varchar("icone", { length: 50 }),
  corTema: varchar("corTema", { length: 7 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Coordenadoria = typeof coordenadorias.$inferSelect;
export type InsertCoordenadoria = typeof coordenadorias.$inferInsert;

/**
 * Sprints table
 */
export const sprints = pgTable("sprints", {
  id: serial("id").primaryKey(),
  numeroSprint: integer("numeroSprint").notNull(),
  dataInicio: timestamp("dataInicio").notNull(),
  dataFim: timestamp("dataFim").notNull(),
  status: sprintStatusEnum("status").default("planejamento").notNull(),
  meta: text("meta"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Sprint = typeof sprints.$inferSelect;
export type InsertSprint = typeof sprints.$inferInsert;

/**
 * Tarefas (tasks) table
 */
export const tarefas = pgTable("tarefas", {
  id: serial("id").primaryKey(),
  sprintId: integer("sprintId").notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  coordenadoriaId: integer("coordenadoriaId"),
  pontosXp: integer("pontosXp").default(10).notNull(),
  prazo: timestamp("prazo"),
  status: tarefaStatusEnum("status").default("todo").notNull(),
  createdBy: integer("createdBy").notNull(),
  feedbackRejeicao: text("feedbackRejeicao"),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Tarefa = typeof tarefas.$inferSelect;
export type InsertTarefa = typeof tarefas.$inferInsert;

/**
 * Tarefas_Membros (task assignments) - N:N relationship
 */
export const tarefasMembros = pgTable("tarefas_membros", {
  id: serial("id").primaryKey(),
  tarefaId: integer("tarefaId").notNull(),
  userId: integer("userId").notNull(),
  contribuicaoPercentual: integer("contribuicaoPercentual").default(100).notNull(),
  completedAt: timestamp("completedAt"),
});

export type TarefaMembro = typeof tarefasMembros.$inferSelect;
export type InsertTarefaMembro = typeof tarefasMembros.$inferInsert;

/**
 * Conquistas (achievements/badges) table
 */
export const conquistas = pgTable("conquistas", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  descricao: text("descricao"),
  categoria: conquistaCategoriaEnum("categoria").notNull(),
  raridade: conquistaRaridadeEnum("raridade").default("bronze").notNull(),
  iconeUrl: varchar("iconeUrl", { length: 500 }),
  criterio: json("criterio").$type<{
    tipo: string;
    quantidade?: number;
    condicao?: string;
  }>(),
  recompensaDicoins: integer("recompensaDicoins").default(10).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Conquista = typeof conquistas.$inferSelect;
export type InsertConquista = typeof conquistas.$inferInsert;

/**
 * User_Conquistas (user achievements) table
 */
export const userConquistas = pgTable("user_conquistas", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  conquistaId: integer("conquistaId").notNull(),
  dataDesbloqueio: timestamp("dataDesbloqueio").defaultNow().notNull(),
});

export type UserConquista = typeof userConquistas.$inferSelect;
export type InsertUserConquista = typeof userConquistas.$inferInsert;

/**
 * Shop_Items table
 */
export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  descricao: text("descricao"),
  categoria: shopItemCategoriaEnum("categoria").notNull(),
  precoDc: integer("precoDc").notNull(),
  raridade: shopItemRaridadeEnum("raridade").default("comum").notNull(),
  requerNivel: nivelEnum("requerNivel").default("trainee").notNull(),
  imagemUrl: varchar("imagemUrl", { length: 500 }),
  disponivel: boolean("disponivel").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShopItem = typeof shopItems.$inferSelect;
export type InsertShopItem = typeof shopItems.$inferInsert;

/**
 * User_Inventory table
 */
export const userInventory = pgTable("user_inventory", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  itemId: integer("itemId").notNull(),
  dataCompra: timestamp("dataCompra").defaultNow().notNull(),
  equipado: boolean("equipado").default(false).notNull(),
});

export type UserInventoryItem = typeof userInventory.$inferSelect;
export type InsertUserInventoryItem = typeof userInventory.$inferInsert;

/**
 * DiCoin_Transactions (log) table
 */
export const dicoinTransactions = pgTable("dicoin_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tipo: dicoinTipoEnum("tipo").notNull(),
  valor: integer("valor").notNull(),
  motivo: varchar("motivo", { length: 255 }).notNull(),
  tarefaId: integer("tarefaId"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type DicoinTransaction = typeof dicoinTransactions.$inferSelect;
export type InsertDicoinTransaction = typeof dicoinTransactions.$inferInsert;

/**
 * Feed_Eventos table
 */
export const feedEventos = pgTable("feed_eventos", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tipo: feedEventoTipoEnum("tipo").notNull(),
  conteudo: json("conteudo").$type<{
    titulo?: string;
    descricao?: string;
    pontos?: number;
    nivel?: string;
    conquistaNome?: string;
    itemNome?: string;
  }>(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type FeedEvento = typeof feedEventos.$inferSelect;
export type InsertFeedEvento = typeof feedEventos.$inferInsert;

/**
 * Feed_Reactions table
 */
export const feedReactions = pgTable("feed_reactions", {
  id: serial("id").primaryKey(),
  eventoId: integer("eventoId").notNull(),
  userId: integer("userId").notNull(),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeedReaction = typeof feedReactions.$inferSelect;
export type InsertFeedReaction = typeof feedReactions.$inferInsert;

/**
 * MARKETING & ANALYTICS TABLES
 */

/**
 * Leads table - CRM integration
 */
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  telefone: varchar("telefone", { length: 20 }),
  empresa: varchar("empresa", { length: 255 }),
  cargo: varchar("cargo", { length: 100 }),
  linkedin: varchar("linkedin", { length: 500 }),
  cpf: varchar("cpf", { length: 20 }),
  origem: canalOrigemEnum("origem").notNull(),
  utmSource: varchar("utmSource", { length: 100 }),
  utmMedium: varchar("utmMedium", { length: 100 }),
  utmCampaign: varchar("utmCampaign", { length: 100 }),
  status: leadStatusEnum("status").default("prospecto").notNull(),
  dataCaptura: timestamp("dataCaptura").defaultNow().notNull(),
  campanhaId: integer("campanhaId"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Campanhas (marketing campaigns) table
 */
export const campanhas = pgTable("campanhas", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  tipo: tipoCampanhaEnum("tipo").notNull(),
  dataInicio: timestamp("dataInicio").notNull(),
  dataFim: timestamp("dataFim"),
  budgetTotal: decimal("budgetTotal", { precision: 10, scale: 2 }),
  objetivo: varchar("objetivo", { length: 255 }),
  status: varchar("status", { length: 50 }).default("ativa").notNull(),
  metricas: json("metricas").$type<{
    impressoes?: number;
    cliques?: number;
    conversoes?: number;
    ctr?: number;
    cpc?: number;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Campanha = typeof campanhas.$inferSelect;
export type InsertCampanha = typeof campanhas.$inferInsert;

/**
 * Metricas_Diarias (daily metrics tracking) table
 */
export const metricasDiarias = pgTable("metricas_diarias", {
  id: serial("id").primaryKey(),
  data: timestamp("data").notNull(),
  canal: canalOrigemEnum("canal").notNull(),
  campanhaId: integer("campanhaId"),
  leadsGerados: integer("leadsGerados").default(0).notNull(),
  impressoes: integer("impressoes").default(0).notNull(),
  cliques: integer("cliques").default(0).notNull(),
  conversoes: integer("conversoes").default(0).notNull(),
  gasto: decimal("gasto", { precision: 10, scale: 2 }).default("0").notNull(),
  receita: decimal("receita", { precision: 10, scale: 2 }).default("0"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MetricaDiaria = typeof metricasDiarias.$inferSelect;
export type InsertMetricaDiaria = typeof metricasDiarias.$inferInsert;

/**
 * Conversoes (lead conversion funnel) table
 */
export const conversoes = pgTable("conversoes", {
  id: serial("id").primaryKey(),
  leadId: integer("leadId").notNull(),
  tipoConversao: varchar("tipoConversao", { length: 100 }).notNull(), // lead_para_proposta, proposta_para_cliente
  dataCriacao: timestamp("dataCriacao").defaultNow().notNull(),
  statusPipeline: varchar("statusPipeline", { length: 50 }).notNull(),
  valorEstimado: decimal("valorEstimado", { precision: 12, scale: 2 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Conversao = typeof conversoes.$inferSelect;
export type InsertConversao = typeof conversoes.$inferInsert;

/**
 * Conteudos (blog posts, ebooks, videos) table
 */
export const conteudos = pgTable("conteudos", {
  id: serial("id").primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // blog, ebook, video, case_study
  urlSlug: varchar("urlSlug", { length: 255 }).unique().notNull(),
  descricao: text("descricao"),
  ebook_downloads: integer("ebook_downloads").default(0),
  views: integer("views").default(0),
  engajamento: integer("engajamento").default(0), // likes, comments, shares
  engajamentRate: decimal("engajamentRate", { precision: 5, scale: 2 }).default("0"),
  publicadoEm: timestamp("publicadoEm"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Conteudo = typeof conteudos.$inferSelect;
export type InsertConteudo = typeof conteudos.$inferInsert;
