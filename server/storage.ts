import { db } from "./db";
import {
  leads,
  callLogs,
  attorneys,
  type Lead,
  type InsertLead,
  type UpdateLeadRequest,
  type CallLog,
  type InsertCallLog,
  type DashboardStats,
  type Attorney,
  type InsertAttorney,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Leads
  getLeads(search?: string, status?: string): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  getLeadByRetellCallId(retellCallId: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, updates: UpdateLeadRequest): Promise<Lead>;

  // ✅ Assign attorney (UUID)
  assignAttorneyToLead(leadId: number, attorneyId: string): Promise<Lead>;

  // Call Logs
  getCallLogs(): Promise<any[]>;
  createCallLog(log: InsertCallLog): Promise<CallLog>;
  getCallLogByRetellCallId(retellCallId: string): Promise<CallLog | undefined>;
  updateCallLogByRetellCallId(
    retellCallId: string,
    updates: Partial<InsertCallLog>
  ): Promise<CallLog>;

  // Attorneys
  getAttorneys(filters?: {
    q?: string;
    city?: string;
    state?: string;
    specialty?: string;
  }): Promise<Attorney[]>;
  createAttorney(attorney: InsertAttorney): Promise<Attorney>;
  getAttorney(attorneyId: string): Promise<Attorney | undefined>;

  // Stats
  getDashboardStats(): Promise<DashboardStats>;
}

// Normalizador fuerte para specialties
function normalizeSpecialties(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];

    // JSON array string
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          return parsed.map((x) => String(x).trim()).filter(Boolean);
        }
      } catch {}
    }

    if (s.includes(",")) return s.split(",").map((x) => x.trim()).filter(Boolean);
    return [s];
  }

  return [];
}

export class DatabaseStorage implements IStorage {
  // -------------------------
  // Attorneys
  // -------------------------
  async getAttorney(attorneyId: string): Promise<Attorney | undefined> {
    const [row] = await db.select().from(attorneys).where(eq(attorneys.id, attorneyId));
    return row;
  }

  async getAttorneys(filters?: {
    q?: string;
    city?: string;
    state?: string;
    specialty?: string;
  }): Promise<Attorney[]> {
    const q = String(filters?.q ?? "").trim().toLowerCase();
    const city = String(filters?.city ?? "").trim().toLowerCase();
    const state = String(filters?.state ?? "").trim().toLowerCase();
    const specialty = String(filters?.specialty ?? "").trim().toLowerCase();

    const rows = await db.select().from(attorneys).orderBy(desc(attorneys.createdAt));

    return rows.filter((a) => {
      if (q) {
        const hay =
          String(a.name ?? "").toLowerCase().includes(q) ||
          String(a.email ?? "").toLowerCase().includes(q) ||
          String(a.phone ?? "").toLowerCase().includes(q);
        if (!hay) return false;
      }

      if (city && !String(a.city ?? "").toLowerCase().includes(city)) return false;
      if (state && !String(a.stateProvince ?? "").toLowerCase().includes(state)) return false;

      if (specialty) {
        const specs = Array.isArray(a.specialties) ? a.specialties : [];
        const ok = specs.some((s) => String(s).toLowerCase().includes(specialty));
        if (!ok) return false;
      }

      return true;
    });
  }

  async createAttorney(attorney: InsertAttorney): Promise<Attorney> {
    const payload: InsertAttorney = {
      ...attorney,
      specialties: normalizeSpecialties((attorney as any).specialties),
    };

    const [row] = await db.insert(attorneys).values(payload).returning();
    return row;
  }

  // -------------------------
  // Leads
  // -------------------------
  async assignAttorneyToLead(leadId: number, attorneyId: string): Promise<Lead> {
    const [updated] = await db
      .update(leads)
      .set({ attorneyId })
      .where(eq(leads.id, leadId))
      .returning();

    if (!updated) throw new Error("Lead no encontrado");
    return updated;
  }

  async getLeads(search?: string, status?: string): Promise<Lead[]> {
    const allLeads = await db.select().from(leads).orderBy(desc(leads.createdAt));

    return allLeads.filter((l) => {
      if (status && status !== "All" && l.status !== status) return false;

      if (search) {
        const s = search.toLowerCase();
        return (
          l.name.toLowerCase().includes(s) ||
          l.phone.includes(search) ||
          (l.caseType?.toLowerCase().includes(s) ?? false)
        );
      }
      return true;
    });
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getLeadByRetellCallId(retellCallId: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.retellCallId, retellCallId));
    return lead;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(insertLead).returning();
    return lead;
  }

  async updateLead(id: number, updates: UpdateLeadRequest): Promise<Lead> {
    const [updated] = await db.update(leads).set(updates).where(eq(leads.id, id)).returning();
    return updated;
  }

  // -------------------------
  // Call Logs
  // -------------------------
  async getCallLogByRetellCallId(retellCallId: string): Promise<CallLog | undefined> {
    const [row] = await db.select().from(callLogs).where(eq(callLogs.retellCallId, retellCallId));
    return row;
  }

  async updateCallLogByRetellCallId(
    retellCallId: string,
    updates: Partial<InsertCallLog>
  ): Promise<CallLog> {
    const [row] = await db
      .update(callLogs)
      .set(updates)
      .where(eq(callLogs.retellCallId, retellCallId))
      .returning();
    return row;
  }

  async getCallLogs(): Promise<any[]> {
    const rows = await db
      .select({
        id: callLogs.id,
        createdAt: callLogs.createdAt,
        retellCallId: callLogs.retellCallId,
        agentId: callLogs.agentId,
        phoneNumber: callLogs.phoneNumber,
        status: callLogs.status,
        direction: callLogs.direction,
        duration: callLogs.duration,
        recordingUrl: callLogs.recordingUrl,
        summary: callLogs.summary,
        transcript: callLogs.transcript,
        sentiment: callLogs.sentiment,
        analysis: callLogs.analysis,
        leadId: leads.id,
        leadName: leads.name,
        caseType: leads.caseType,
        urgency: leads.urgency,
        attorneyId: leads.attorneyId,
      })
      .from(callLogs)
      .leftJoin(leads, eq(callLogs.leadId, leads.id))
      .orderBy(desc(callLogs.createdAt));

    return rows;
  }

  async createCallLog(insertLog: InsertCallLog): Promise<CallLog> {
    const [log] = await db.insert(callLogs).values(insertLog).returning();
    return log;
  }

  // -------------------------
  // Stats
  // -------------------------
  async getDashboardStats(): Promise<DashboardStats> {
    const allLeads = await db.select().from(leads);
    const total = allLeads.length;
    const qualified = allLeads.filter((l) => l.status === "Qualified").length;
    const converted = allLeads.filter((l) => l.status === "Converted").length;

    return {
      totalLeads: total,
      qualifiedLeads: qualified,
      convertedLeads: converted,
      avgResponseTimeMinutes: 18,
    };
  }
}

export const storage = new DatabaseStorage();
