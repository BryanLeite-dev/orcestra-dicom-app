import type { Request, Response } from "express";
import { getDb } from "../db";
import { leads as leadsTable } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface WebhookPayload {
  nome: string;
  email: string;
  cargo?: string;
  telefone?: string;
  empresa?: string;
  origem: string;
  necessidade?: string;
  [key: string]: any;
}

/**
 * POST /api/webhook/leads
 *
 * Receives lead data from email automation services (Zapier, Mailchimp, etc)
 * and stores in database
 *
 * Expected JSON body:
 * {
 *   "nome": "Gustavo Macedo de Carvalho",
 *   "email": "gustavo@empresa.com",
 *   "cargo": "CEO/Sócio/Diretor",
 *   "telefone": "(61) 99294-9999",
 *   "empresa": "Acme Corp",
 *   "origem": "google_ads",
 *   "necessidade": "Melhorar gamificação de app"
 * }
 */
export async function handleLeadWebhook(req: Request, res: Response) {
  try {
    // Validate API key or bearer token
    const authHeader = req.headers.authorization;
    const apiKey = process.env.WEBHOOK_API_KEY;

    if (apiKey && (!authHeader || !authHeader.startsWith("Bearer "))) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (apiKey) {
      const token = authHeader?.replace("Bearer ", "");
      if (token !== apiKey) {
        return res.status(403).json({ error: "Invalid API key" });
      }
    }

    const payload: WebhookPayload = req.body;

    // Validate required fields
    if (!payload.nome || !payload.email) {
      return res.status(400).json({
        error: "Missing required fields: nome, email",
      });
    }

    // Normalize origem
    const validOrigens = [
      "google_ads",
      "linkedin",
      "instagram",
      "ebook",
      "organico_linkedin",
      "referral",
      "direto",
    ];
    const origem = validOrigens.includes(payload.origem.toLowerCase())
      ? payload.origem.toLowerCase()
      : "direto";

    const db = await getDb();
    
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    // Check if email already exists
    const existing = await db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.email, payload.email.toLowerCase()));

    let lead;

    if (existing.length > 0) {
      // Update existing lead
      const [updated] = await db
        .update(leadsTable)
        .set({
          nome: payload.nome,
          cargo: payload.cargo || existing[0].cargo,
          telefone: payload.telefone || existing[0].telefone,
          empresa: payload.empresa || existing[0].empresa,
          origem: origem as any,
          observacoes: payload.necessidade || existing[0].observacoes,
          // Keep status as is unless provided
        })
        .where(eq(leadsTable.id, existing[0].id))
        .returning();

      lead = updated;

      return res.status(200).json({
        success: true,
        created: false,
        message: "Lead atualizado com sucesso",
        leadId: lead.id,
      });
    }

    // Create new lead
    const [newLead] = await db
      .insert(leadsTable)
      .values({
        nome: payload.nome,
        email: payload.email.toLowerCase(),
        cargo: payload.cargo || null,
        telefone: payload.telefone || null,
        empresa: payload.empresa || null,
        origem: origem as any,
        observacoes: payload.necessidade || null,
        status: "prospecto",
        dataCaptura: new Date(),
      })
      .returning();

    return res.status(201).json({
      success: true,
      created: true,
      message: "Lead criado com sucesso",
      leadId: newLead.id,
    });
  } catch (error) {
    console.error("[WEBHOOK] Error processing lead:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
