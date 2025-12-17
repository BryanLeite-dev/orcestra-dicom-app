# Orc'estra DiCoM App - TODO

## Fase 1: Infraestrutura e Identidade Visual
- [x] Configurar paleta de cores Orc'estra (verde primário, beige, etc.)
- [x] Configurar tipografia (Ubuntu, Poppins)
- [x] Criar schema do banco de dados completo

## Fase 2: Sistema de Usuários e Autenticação
- [x] Estender tabela users com campos de gamificação (XP, DiCoins, nível, streak)
- [x] Criar tabela de coordenadorias
- [x] Criar tabela de sprints
- [x] Criar tabela de tarefas
- [x] Criar tabela de tarefas_membros (N:N)
- [x] Criar tabela de conquistas
- [x] Criar tabela de user_conquistas
- [x] Criar tabela de shop_items
- [x] Criar tabela de user_inventory
- [x] Criar tabela de dicoin_transactions
- [x] Criar tabela de feed_eventos

## Fase 3: API Backend
- [x] Criar rotas de sprints (CRUD)
- [x] Criar rotas de tarefas (CRUD + movimentação Kanban)
- [x] Criar rotas de coordenadorias
- [x] Criar rotas de gamificação (XP, DiCoins, níveis)
- [x] Criar rotas de loja (itens, compra)
- [x] Criar rotas de conquistas
- [x] Criar rotas de feed

## Fase 4: Frontend - Layout e Navegação
- [x] Criar layout principal com sidebar
- [x] Criar navegação entre páginas
- [x] Implementar header com info do usuário

## Fase 5: Dashboard do Membro
- [x] Criar página de dashboard com sprint atual
- [x] Mostrar tarefas pendentes
- [x] Mostrar progresso da sprint
- [x] Mostrar XP e DiCoins
- [x] Mostrar próxima conquista

## Fase 6: Kanban de Tarefas
- [x] Criar board Kanban com 4 colunas
- [x] Implementar movimentação de cards
- [x] Criar modal de detalhes da tarefa
- [x] Implementar aprovação/rejeição (diretor)

## Fase 7: Perfil do Usuário
- [x] Criar página de perfil
- [x] Mostrar avatar e customização
- [x] Mostrar nível e progresso
- [x] Mostrar streak
- [x] Mostrar conquistas
- [x] Mostrar estatísticas

## Fase 8: Loja de Customização
- [x] Criar página da loja
- [x] Listar itens por categoria
- [x] Implementar preview de item
- [x] Implementar compra de item
- [x] Gerenciar inventário

## Fase 9: Feed de Conquistas
- [x] Criar página de feed
- [x] Listar eventos (tarefas, níveis, conquistas)
- [x] Implementar reações com emoji

## Fase 10: Dashboard do Diretor
- [x] Criar visão geral de coordenadorias
- [x] Mostrar métricas consolidadas
- [x] Listar tarefas em review
- [x] Gerenciar sprints e tarefas

## Fase 11: Testes
- [x] Criar testes para rotas de API
- [x] Criar testes para lógica de gamificação

## Fase 12: Página de Apresentação
- [x] Criar página web estática interativa
- [x] Visualização de dados com gráficos
- [x] Seções de funcionalidades e gamificação
- [x] Abas interativas para explorar dados
- [x] Design moderno e profissional

## Fase 13: Sistema de Autenticação Local
- [x] Criar rotas de login e registro
- [x] Implementar hash de senha com SHA256
- [x] Gerar tokens JWT
- [x] Criar página de login com abas
- [x] Validar credenciais
- [x] Controle de permissões por role (user/director)
- [ ] Testar fluxo completo de autenticação
- [ ] Proteger rotas administrativas
