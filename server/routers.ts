import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { sprintsRouter } from "./routers/sprints";
import { tarefasRouter } from "./routers/tarefas";
import { coordenadoriasRouter } from "./routers/coordenadorias";
import { shopRouter } from "./routers/shop";
import { gamificationRouter } from "./routers/gamification";
import { usersRouter } from "./routers/users";
import { authLocalRouter } from "./routers/authLocal";
import { analyticsRouter } from "./routers/analytics";
import type { AnyRouter } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    loginLocal: authLocalRouter._def.procedures.loginLocal,
    registerLocal: authLocalRouter._def.procedures.registerLocal,
    verifyToken: authLocalRouter._def.procedures.verifyToken,
  }),

  // Feature routers
  sprints: sprintsRouter,
  tarefas: tarefasRouter,
  coordenadorias: coordenadoriasRouter,
  shop: shopRouter,
  gamification: gamificationRouter,
  users: usersRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
