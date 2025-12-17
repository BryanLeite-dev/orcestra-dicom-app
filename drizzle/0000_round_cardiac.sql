CREATE TYPE "public"."conquista_categoria" AS ENUM('valor', 'comunicacao', 'estruturacao');--> statement-breakpoint
CREATE TYPE "public"."conquista_raridade" AS ENUM('bronze', 'prata', 'ouro');--> statement-breakpoint
CREATE TYPE "public"."dicoin_tipo" AS ENUM('ganho', 'gasto', 'perda');--> statement-breakpoint
CREATE TYPE "public"."feed_evento_tipo" AS ENUM('tarefa_completa', 'nivel_subiu', 'conquista', 'meta_coletiva', 'item_comprado');--> statement-breakpoint
CREATE TYPE "public"."nivel" AS ENUM('trainee', 'assessor', 'coordenador', 'maestro', 'virtuoso');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'director');--> statement-breakpoint
CREATE TYPE "public"."shop_item_categoria" AS ENUM('roupa', 'acessorio', 'ferramenta', 'pet', 'efeito', 'edicao_limitada');--> statement-breakpoint
CREATE TYPE "public"."shop_item_raridade" AS ENUM('comum', 'raro', 'epico', 'lendario');--> statement-breakpoint
CREATE TYPE "public"."sprint_status" AS ENUM('planejamento', 'ativa', 'concluida');--> statement-breakpoint
CREATE TYPE "public"."tarefa_status" AS ENUM('todo', 'in_progress', 'review', 'done', 'rejected');--> statement-breakpoint
CREATE TABLE "conquistas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" text,
	"categoria" "conquista_categoria" NOT NULL,
	"raridade" "conquista_raridade" DEFAULT 'bronze' NOT NULL,
	"iconeUrl" varchar(500),
	"criterio" json,
	"recompensaDicoins" integer DEFAULT 10 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coordenadorias" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" text,
	"icone" varchar(50),
	"corTema" varchar(7),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coordenadorias_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "dicoin_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tipo" "dicoin_tipo" NOT NULL,
	"valor" integer NOT NULL,
	"motivo" varchar(255) NOT NULL,
	"tarefaId" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_eventos" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tipo" "feed_evento_tipo" NOT NULL,
	"conteudo" json,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"eventoId" integer NOT NULL,
	"userId" integer NOT NULL,
	"emoji" varchar(10) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" text,
	"categoria" "shop_item_categoria" NOT NULL,
	"precoDc" integer NOT NULL,
	"raridade" "shop_item_raridade" DEFAULT 'comum' NOT NULL,
	"requerNivel" "nivel" DEFAULT 'trainee' NOT NULL,
	"imagemUrl" varchar(500),
	"disponivel" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"numeroSprint" integer NOT NULL,
	"dataInicio" timestamp NOT NULL,
	"dataFim" timestamp NOT NULL,
	"status" "sprint_status" DEFAULT 'planejamento' NOT NULL,
	"meta" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tarefas" (
	"id" serial PRIMARY KEY NOT NULL,
	"sprintId" integer NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"descricao" text,
	"coordenadoriaId" integer,
	"pontosXp" integer DEFAULT 10 NOT NULL,
	"prazo" timestamp,
	"status" "tarefa_status" DEFAULT 'todo' NOT NULL,
	"createdBy" integer NOT NULL,
	"feedbackRejeicao" text,
	"tags" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tarefas_membros" (
	"id" serial PRIMARY KEY NOT NULL,
	"tarefaId" integer NOT NULL,
	"userId" integer NOT NULL,
	"contribuicaoPercentual" integer DEFAULT 100 NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_conquistas" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"conquistaId" integer NOT NULL,
	"dataDesbloqueio" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"itemId" integer NOT NULL,
	"dataCompra" timestamp DEFAULT now() NOT NULL,
	"equipado" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(128) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	"coordenadoriaId" integer,
	"nivel" "nivel" DEFAULT 'trainee',
	"xpTotal" integer DEFAULT 0,
	"xpSprintAtual" integer DEFAULT 0,
	"dicoinsSaldo" integer DEFAULT 0,
	"dicoinsTotalGanho" integer DEFAULT 0,
	"dicoinsTotalGasto" integer DEFAULT 0,
	"streakAtual" integer DEFAULT 0,
	"streakRecorde" integer DEFAULT 0,
	"temEscudo" boolean DEFAULT false,
	"segundaChanceDisponivel" boolean DEFAULT true,
	"avatarConfig" json,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
