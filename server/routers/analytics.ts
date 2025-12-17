import { router, directorProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { leads, campanhas, metricasDiarias, conversoes, conteudos } from "../../drizzle/schema";
import { eq, gte, lte, count, sql, and } from "drizzle-orm";

/**
 * Analytics Router - Performance metrics and KPIs
 * Only directors can access
 */
export const analyticsRouter = router({
  /**
   * Get Northstar Metric: Leads Passivos Qualificados por Mês
   */
  getNorthstarMetric: directorProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { current: 0, meta: 15, percentual: 0, status: "abaixo_meta" };

    const thisMonth = new Date();
    thisMonth.setDate(1);
    
    const nextMonth = new Date(thisMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Count leads generated this month that are qualificados or beyond
    const result = await db
      .select({ count: count() })
      .from(leads)
      .where(
        sql`
          DATE_TRUNC('month', "dataCaptura") = DATE_TRUNC('month', ${thisMonth})
          AND status IN ('qualificado', 'proposta', 'cliente')
        `
      );

    const current = result[0]?.count || 0;
    const meta = 15; // From proposal: 15 leads/month until June 2026

    return {
      current,
      meta,
      percentual: Math.round((current / meta) * 100),
      status: current >= meta ? "atingida" : current >= meta * 0.7 ? "progresso" : "abaixo_meta",
    };
  }),

  /**
   * Get KPI: CPL (Custo por Lead)
   */
  getCPL: directorProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { current: 0, meta: 50, moeda: "R$", status: "atingida" };

    const thisMonth = new Date();
    thisMonth.setDate(1);

    // Sum total gasto and count leads this month
    const result = await db
      .select({
        totalGasto: sql<number>`COALESCE(SUM(CAST("gasto" AS DECIMAL)), 0)`,
        totalLeads: count(),
      })
      .from(metricasDiarias)
      .where(gte(metricasDiarias.data, thisMonth));

    const totalGasto = Number(result[0]?.totalGasto) || 0;
    const totalLeads = result[0]?.totalLeads || 0;

    const cpl = totalLeads > 0 ? totalGasto / totalLeads : 0;
    const meta = 50; // < R$50 per lead

    return {
      current: Number(cpl.toFixed(2)),
      meta,
      moeda: "R$",
      status: cpl < meta ? "atingida" : "acima_meta",
    };
  }),

  /**
   * Get KPI: Leads por Canal (breakdown by origin)
   */
  getLeadsPorCanal: directorProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const thisMonth = new Date();
    thisMonth.setDate(1);

    const result = await db
      .select({
        canal: leads.origem,
        total: count(),
      })
      .from(leads)
      .where(gte(leads.dataCaptura, thisMonth))
      .groupBy(leads.origem);

    const totalLeads = result.reduce((sum, r) => sum + (r.total || 0), 0);

    return result.map((r) => ({
      canal: r.canal,
      quantidade: r.total || 0,
      percentual: totalLeads > 0 ? Math.round(((r.total || 0) / totalLeads) * 100) : 0,
    }));
  }),

  /**
   * Get KPI: Taxa de Conversão Lead → Proposta
   */
  getTaxaConversao: directorProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { current: 0, meta: 50, total: 0, comProposta: 0, status: "abaixo_meta" };

    const thisMonth = new Date();
    thisMonth.setDate(1);

    const totalLeads = await db
      .select({ count: count() })
      .from(leads)
      .where(gte(leads.dataCaptura, thisMonth));

    const leadsComProposta = await db
      .select({ count: count() })
      .from(conversoes)
      .where(
        sql`
          DATE_TRUNC('month', "dataCriacao") = DATE_TRUNC('month', ${thisMonth})
          AND "tipoConversao" = 'lead_para_proposta'
        `
      );

    const total = totalLeads[0]?.count || 0;
    const comProposta = leadsComProposta[0]?.count || 0;
    const taxa = total > 0 ? (comProposta / total) * 100 : 0;
    const meta = 50; // 50% target

    return {
      current: Math.round(taxa),
      meta,
      total,
      comProposta,
      status: taxa >= meta ? "atingida" : "abaixo_meta",
    };
  }),

  /**
   * Get KPI: Cases de Sucesso Documentados
   */
  getCases: directorProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { current: 0, meta: 5, percentual: 0, status: "progresso" };

    const result = await db
      .select({ count: count() })
      .from(conteudos)
      .where(eq(conteudos.tipo, "case_study"));

    const current = result[0]?.count || 0;
    const meta = 5; // 5 cases until June 2026

    return {
      current,
      meta,
      percentual: Math.round((current / meta) * 100),
      status: current >= meta ? "atingida" : "progresso",
    };
  }),

  /**
   * Get KPI: E-book Downloads
   */
  getEbookDownloads: directorProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { current: 0, meta: 100, percentual: 0, status: "progresso" };

    const result = await db
      .select({
        totalDownloads: sql<number>`COALESCE(SUM("ebook_downloads"), 0)`,
      })
      .from(conteudos)
      .where(eq(conteudos.tipo, "ebook"));

    const current = Number(result[0]?.totalDownloads) || 0;
    const meta = 100; // 100 downloads per ebook in 3 months

    return {
      current,
      meta,
      percentual: Math.round((current / meta) * 100),
      status: current >= meta ? "atingida" : "progresso",
    };
  }),

  /**
   * Get KPI: Crescimento de Comunidade (Email List)
   */
  getComunidade: directorProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { current: 0, meta: 200, percentual: 0, status: "progresso" };

    const result = await db
      .select({ count: count() })
      .from(leads)
      .where(
        sql`
          status IN ('qualificado', 'proposta', 'cliente', 'prospecto')
          AND email IS NOT NULL
        `
      );

    const current = result[0]?.count || 0;
    const meta = 200; // 200 emails by September 2026

    return {
      current,
      meta,
      percentual: Math.round((current / meta) * 100),
      status: current >= meta ? "atingida" : "progresso",
    };
  }),

  /**
   * Get KPI: Engagement nas Redes Sociais
   */
  getEngajamentoRedes: directorProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      return {
        taxaEngajamento: 0,
        totalViews: 0,
        totalEngajamento: 0,
        linkedin: { meta: 5 },
        instagram: { meta: 8 },
      };

    const result = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM("views"), 0)`,
        totalEngajamento: sql<number>`COALESCE(SUM("engajamento"), 0)`,
      })
      .from(conteudos);

    const totalViews = Number(result[0]?.totalViews) || 1; // Avoid division by zero
    const totalEngajamento = Number(result[0]?.totalEngajamento) || 0;
    const taxaEngajamento = (totalEngajamento / totalViews) * 100;

    return {
      taxaEngajamento: Number(taxaEngajamento.toFixed(2)),
      totalViews,
      totalEngajamento,
      linkedin: { meta: 5 },
      instagram: { meta: 8 },
    };
  }),

  /**
   * Get Dashboard Overview (all KPIs summary)
   */
  getDashboardOverview: directorProcedure.query(async (opts) => {
    // Since we can't call procedures from within procedures, we'll do the queries directly
    const db = await getDb();
    if (!db)
      return {
        northstar: { current: 0, meta: 15, percentual: 0, status: "abaixo_meta" },
        cpl: { current: 0, meta: 50, moeda: "R$", status: "atingida" },
        leadsCanal: [],
        conversao: { current: 0, meta: 50, total: 0, comProposta: 0, status: "abaixo_meta" },
        cases: { current: 0, meta: 5, percentual: 0, status: "progresso" },
        ebooks: { current: 0, meta: 100, percentual: 0, status: "progresso" },
        comunidade: { current: 0, meta: 200, percentual: 0, status: "progresso" },
        engajamento: { taxaEngajamento: 0, totalViews: 0, totalEngajamento: 0, linkedin: { meta: 5 }, instagram: { meta: 8 } },
      };

    const thisMonth = new Date();
    thisMonth.setDate(1);

    // Northstar
    const northstarResult = await db
      .select({ count: count() })
      .from(leads)
      .where(
        sql`
          DATE_TRUNC('month', "dataCaptura") = DATE_TRUNC('month', ${thisMonth})
          AND status IN ('qualificado', 'proposta', 'cliente')
        `
      );
    const northstarCurrent = northstarResult[0]?.count || 0;
    const northstar = {
      current: northstarCurrent,
      meta: 15,
      percentual: Math.round((northstarCurrent / 15) * 100),
      status: northstarCurrent >= 15 ? "atingida" : northstarCurrent >= 10.5 ? "progresso" : "abaixo_meta",
    };

    // CPL
    const cplResult = await db
      .select({
        totalGasto: sql<number>`COALESCE(SUM(CAST("gasto" AS DECIMAL)), 0)`,
        totalLeads: count(),
      })
      .from(metricasDiarias)
      .where(gte(metricasDiarias.data, thisMonth));

    const totalGasto = Number(cplResult[0]?.totalGasto) || 0;
    const totalLeads = cplResult[0]?.totalLeads || 0;
    const cplValue = totalLeads > 0 ? totalGasto / totalLeads : 0;
    const cpl = {
      current: Number(cplValue.toFixed(2)),
      meta: 50,
      moeda: "R$",
      status: cplValue < 50 ? "atingida" : "acima_meta",
    };

    // Leads por Canal
    const leadsCanaiResult = await db
      .select({
        canal: leads.origem,
        total: count(),
      })
      .from(leads)
      .where(gte(leads.dataCaptura, thisMonth))
      .groupBy(leads.origem);

    const totalLeadsCanal = leadsCanaiResult.reduce((sum, r) => sum + (r.total || 0), 0);
    const leadsCanal = leadsCanaiResult.map((r) => ({
      canal: r.canal,
      quantidade: r.total || 0,
      percentual: totalLeadsCanal > 0 ? Math.round(((r.total || 0) / totalLeadsCanal) * 100) : 0,
    }));

    // Conversão
    const totalLeadsConv = await db
      .select({ count: count() })
      .from(leads)
      .where(gte(leads.dataCaptura, thisMonth));

    const leadsComPropostaConv = await db
      .select({ count: count() })
      .from(conversoes)
      .where(
        sql`
          DATE_TRUNC('month', "dataCriacao") = DATE_TRUNC('month', ${thisMonth})
          AND "tipoConversao" = 'lead_para_proposta'
        `
      );

    const totalConv = totalLeadsConv[0]?.count || 0;
    const comPropostaConv = leadsComPropostaConv[0]?.count || 0;
    const taxaConv = totalConv > 0 ? (comPropostaConv / totalConv) * 100 : 0;
    const conversao = {
      current: Math.round(taxaConv),
      meta: 50,
      total: totalConv,
      comProposta: comPropostaConv,
      status: taxaConv >= 50 ? "atingida" : "abaixo_meta",
    };

    // Cases
    const casesResult = await db
      .select({ count: count() })
      .from(conteudos)
      .where(eq(conteudos.tipo, "case_study"));
    const casesCurrent = casesResult[0]?.count || 0;
    const cases = {
      current: casesCurrent,
      meta: 5,
      percentual: Math.round((casesCurrent / 5) * 100),
      status: casesCurrent >= 5 ? "atingida" : "progresso",
    };

    // Ebooks
    const ebooksResult = await db
      .select({
        totalDownloads: sql<number>`COALESCE(SUM("ebook_downloads"), 0)`,
      })
      .from(conteudos)
      .where(eq(conteudos.tipo, "ebook"));
    const ebooksCurrent = Number(ebooksResult[0]?.totalDownloads) || 0;
    const ebooks = {
      current: ebooksCurrent,
      meta: 100,
      percentual: Math.round((ebooksCurrent / 100) * 100),
      status: ebooksCurrent >= 100 ? "atingida" : "progresso",
    };

    // Comunidade
    const comunidadeResult = await db
      .select({ count: count() })
      .from(leads)
      .where(
        sql`
          status IN ('qualificado', 'proposta', 'cliente', 'prospecto')
          AND email IS NOT NULL
        `
      );
    const comunidadeCurrent = comunidadeResult[0]?.count || 0;
    const comunidade = {
      current: comunidadeCurrent,
      meta: 200,
      percentual: Math.round((comunidadeCurrent / 200) * 100),
      status: comunidadeCurrent >= 200 ? "atingida" : "progresso",
    };

    // Engajamento
    const engajamentoResult = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM("views"), 0)`,
        totalEngajamento: sql<number>`COALESCE(SUM("engajamento"), 0)`,
      })
      .from(conteudos);
    const totalViewsEng = Number(engajamentoResult[0]?.totalViews) || 1;
    const totalEngajamentoEng = Number(engajamentoResult[0]?.totalEngajamento) || 0;
    const taxaEngajamentoEng = (totalEngajamentoEng / totalViewsEng) * 100;
    const engajamento = {
      taxaEngajamento: Number(taxaEngajamentoEng.toFixed(2)),
      totalViews: totalViewsEng,
      totalEngajamento: totalEngajamentoEng,
      linkedin: { meta: 5 },
      instagram: { meta: 8 },
    };

    return {
      northstar,
      cpl,
      leadsCanal,
      conversao,
      cases,
      ebooks,
      comunidade,
      engajamento,
    };
  }),

  /**
   * Get Leads List with pagination
   */
  getLeads: directorProcedure
    .input((input: any) => ({
      page: input?.page || 1,
      limit: input?.limit || 10,
      status: input?.status,
      canal: input?.canal,
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0, page: input.page, limit: input.limit };

      const offset = (input.page - 1) * input.limit;

      const conditions = [];
      
      if (input.status) {
        conditions.push(eq(leads.status, input.status));
      }

      if (input.canal) {
        conditions.push(eq(leads.origem, input.canal));
      }

      const whereCondition = conditions.length > 0
        ? conditions.length > 1
          ? and(...conditions)
          : conditions[0]
        : undefined;

      const items = await db
        .select()
        .from(leads)
        .where(whereCondition)
        .limit(input.limit)
        .offset(offset);

      const totalResult = await db
        .select({ count: count() })
        .from(leads)
        .where(whereCondition);

      return {
        items,
        total: totalResult[0]?.count || 0,
        page: input.page,
        limit: input.limit,
      };
    }),

  /**
   * Create a Lead (manual entry)
   */
  createLead: directorProcedure
    .input((input: any) => ({
      nome: input.nome,
      email: input.email,
      telefone: input.telefone,
      empresa: input.empresa,
      origem: input.origem,
      utmSource: input.utmSource,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .insert(leads)
        .values({
          nome: input.nome,
          email: input.email,
          telefone: input.telefone,
          empresa: input.empresa,
          origem: input.origem,
          utmSource: input.utmSource,
          status: "prospecto",
        })
        .returning();

      return result[0];
    }),

  /**
   * Create Lead from Email Template
   * Receives data from email form with structure:
   * - Qual o seu nome?
   * - Qual seu melhor e-mail?
   * - Qual seu cargo?
   * - Por onde você nos conheceu?
   * - Qual seu telefone?
   * - Nos conte um pouco sobre sua necessidade
   */
  createLeadFromEmail: directorProcedure
    .input((input: any) => ({
      nome: input.nome,
      email: input.email,
      cargo: input.cargo,
      origem: input.origem, // Indicação, Google Ads, LinkedIn, etc
      telefone: input.telefone,
      necessidade: input.necessidade,
      empresa: input.empresa,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      // Validate required fields
      if (!input.nome || !input.email) {
        throw new Error("Nome e email são obrigatórios");
      }

      // Check if email already exists
      const existing = await db
        .select()
        .from(leads)
        .where(eq(leads.email, input.email));

      if (existing.length > 0) {
        // Update existing lead
        const result = await db
          .update(leads)
          .set({
            nome: input.nome,
            cargo: input.cargo,
            origem: input.origem as any,
            telefone: input.telefone,
            observacoes: input.necessidade,
            empresa: input.empresa,
            updatedAt: new Date(),
          })
          .where(eq(leads.email, input.email))
          .returning();

        return { created: false, lead: result[0], message: "Lead atualizado" };
      }

      // Create new lead
      const result = await db
        .insert(leads)
        .values({
          nome: input.nome,
          email: input.email,
          telefone: input.telefone,
          empresa: input.empresa,
          origem: (input.origem || "direto") as any,
          status: "prospecto",
          observacoes: input.necessidade,
        })
        .returning();

      return { created: true, lead: result[0], message: "Lead criado com sucesso" };
    }),

  /**
   * Update Lead status (prospecto → qualificado → proposta → cliente)
   */
  updateLeadStatus: directorProcedure
    .input((input: any) => ({
      leadId: input.leadId,
      novoStatus: input.novoStatus, // prospecto, qualificado, proposta, cliente, perdido
      observacoes: input.observacoes,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const validStatuses = ["prospecto", "qualificado", "proposta", "cliente", "perdido"];
      if (!validStatuses.includes(input.novoStatus)) {
        throw new Error("Status inválido");
      }

      const result = await db
        .update(leads)
        .set({
          status: input.novoStatus as any,
          observacoes: input.observacoes,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, input.leadId))
        .returning();

      return result[0];
    }),
});
