import { relations } from "drizzle-orm";
import {
  users,
  coordenadorias,
  sprints,
  tarefas,
  tarefasMembros,
  conquistas,
  userConquistas,
  shopItems,
  userInventory,
  dicoinTransactions,
  feedEventos,
  feedReactions,
} from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  coordenadoria: one(coordenadorias, {
    fields: [users.coordenadoriaId],
    references: [coordenadorias.id],
  }),
  tarefasMembros: many(tarefasMembros),
  conquistas: many(userConquistas),
  inventory: many(userInventory),
  transactions: many(dicoinTransactions),
  feedEventos: many(feedEventos),
  feedReactions: many(feedReactions),
}));

export const coordenadoriasRelations = relations(coordenadorias, ({ many }) => ({
  membros: many(users),
  tarefas: many(tarefas),
}));

export const sprintsRelations = relations(sprints, ({ many }) => ({
  tarefas: many(tarefas),
}));

export const tarefasRelations = relations(tarefas, ({ one, many }) => ({
  sprint: one(sprints, {
    fields: [tarefas.sprintId],
    references: [sprints.id],
  }),
  coordenadoria: one(coordenadorias, {
    fields: [tarefas.coordenadoriaId],
    references: [coordenadorias.id],
  }),
  criador: one(users, {
    fields: [tarefas.createdBy],
    references: [users.id],
  }),
  membros: many(tarefasMembros),
}));

export const tarefasMembrosRelations = relations(tarefasMembros, ({ one }) => ({
  tarefa: one(tarefas, {
    fields: [tarefasMembros.tarefaId],
    references: [tarefas.id],
  }),
  user: one(users, {
    fields: [tarefasMembros.userId],
    references: [users.id],
  }),
}));

export const conquistasRelations = relations(conquistas, ({ many }) => ({
  usuarios: many(userConquistas),
}));

export const userConquistasRelations = relations(userConquistas, ({ one }) => ({
  user: one(users, {
    fields: [userConquistas.userId],
    references: [users.id],
  }),
  conquista: one(conquistas, {
    fields: [userConquistas.conquistaId],
    references: [conquistas.id],
  }),
}));

export const shopItemsRelations = relations(shopItems, ({ many }) => ({
  inventarios: many(userInventory),
}));

export const userInventoryRelations = relations(userInventory, ({ one }) => ({
  user: one(users, {
    fields: [userInventory.userId],
    references: [users.id],
  }),
  item: one(shopItems, {
    fields: [userInventory.itemId],
    references: [shopItems.id],
  }),
}));

export const dicoinTransactionsRelations = relations(dicoinTransactions, ({ one }) => ({
  user: one(users, {
    fields: [dicoinTransactions.userId],
    references: [users.id],
  }),
  tarefa: one(tarefas, {
    fields: [dicoinTransactions.tarefaId],
    references: [tarefas.id],
  }),
}));

export const feedEventosRelations = relations(feedEventos, ({ one, many }) => ({
  user: one(users, {
    fields: [feedEventos.userId],
    references: [users.id],
  }),
  reactions: many(feedReactions),
}));

export const feedReactionsRelations = relations(feedReactions, ({ one }) => ({
  evento: one(feedEventos, {
    fields: [feedReactions.eventoId],
    references: [feedEventos.id],
  }),
  user: one(users, {
    fields: [feedReactions.userId],
    references: [users.id],
  }),
}));
