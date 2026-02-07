
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("Unknown Lead"),
  phone: text("phone").notNull(),
  caseType: text("case_type").default("General"),
  urgency: text("urgency").default("Medium"), // Low, Medium, High, Critical
  status: text("status").notNull().default("New"), // New, Qualified, Converted, Contacted, Disqualified
  retellCallId: text("retell_call_id").unique(),
  retellAgentId: text("retell_agent_id"),
  summary: text("summary"),
  transcript: text("transcript"),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const callLogs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  retellCallId: text("retell_call_id").notNull(),
  agentId: text("agent_id"),
  phoneNumber: text("phone_number"),
  status: text("status"), // ongoing, completed, error
  direction: text("direction").default("inbound"),
  duration: integer("duration"), // in seconds
  recordingUrl: text("recording_url"),
  analysis: jsonb("analysis"), // Store raw analysis JSON
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const leadsRelations = relations(leads, ({ many }) => ({
  callLogs: many(callLogs),
}));

export const callLogsRelations = relations(callLogs, ({ one }) => ({
  lead: one(leads, {
    fields: [callLogs.leadId],
    references: [leads.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, lastContactedAt: true });
export const insertCallLogSchema = createInsertSchema(callLogs).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;

// Request types
export type CreateLeadRequest = InsertLead;
export type UpdateLeadRequest = Partial<InsertLead>;

// Webhook Payload Schema (Approximate based on Retell docs/common patterns)
export const retellWebhookSchema = z.object({
  event: z.string(),
  call_id: z.string(),
  agent_id: z.string(),
  call_analysis: z.any().optional(), // Flexible for now
  transcript: z.string().optional(),
  recording_url: z.string().optional(),
  duration_ms: z.number().optional(),
});

export type RetellWebhookPayload = z.infer<typeof retellWebhookSchema>;

// Stats Response
export interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  avgResponseTimeMinutes: number;
}
