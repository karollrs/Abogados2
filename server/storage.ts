
import { db } from "./db";
import {
  leads, callLogs,
  type Lead, type InsertLead, type UpdateLeadRequest,
  type CallLog, type InsertCallLog,
  type DashboardStats
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Leads
  getLeads(search?: string, status?: string): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  getLeadByRetellCallId(retellCallId: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, updates: UpdateLeadRequest): Promise<Lead>;
  
  // Call Logs
  createCallLog(log: InsertCallLog): Promise<CallLog>;
  
  // Stats
  getDashboardStats(): Promise<DashboardStats>;
}

export class DatabaseStorage implements IStorage {
  async getLeads(search?: string, status?: string): Promise<Lead[]> {
    let query = db.select().from(leads).orderBy(desc(leads.createdAt));
    
    // Simple in-memory filtering for now, or build dynamic query
    // Since Drizzle query builder is cleaner with explicit conditions
    // For this MVP, we return all and filter in memory if complex, 
    // or use simple where clauses.
    
    const allLeads = await query;
    return allLeads.filter(l => {
        if (status && status !== 'All' && l.status !== status) return false;
        if (search) {
            const searchLower = search.toLowerCase();
            return l.name.toLowerCase().includes(searchLower) || 
                   l.phone.includes(search) ||
                   l.caseType?.toLowerCase().includes(searchLower);
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
    const [updated] = await db.update(leads)
      .set(updates)
      .where(eq(leads.id, id))
      .returning();
    return updated;
  }

  async createCallLog(insertLog: InsertCallLog): Promise<CallLog> {
    const [log] = await db.insert(callLogs).values(insertLog).returning();
    return log;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    // In a real app, these would be aggregations
    const allLeads = await db.select().from(leads);
    
    const total = allLeads.length;
    const qualified = allLeads.filter(l => l.status === 'Qualified').length;
    const converted = allLeads.filter(l => l.status === 'Converted').length;
    
    // Mock avg response time for MVP
    const avgResponseTimeMinutes = 18; 

    return {
      totalLeads: total,
      qualifiedLeads: qualified,
      convertedLeads: converted,
      avgResponseTimeMinutes
    };
  }
}

export const storage = new DatabaseStorage();
