
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Dashboard Stats
  app.get(api.leads.stats.path, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // Leads List
  app.get(api.leads.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const leads = await storage.getLeads(search, status);
    res.json(leads);
  });

  // Get Single Lead
  app.get(api.leads.get.path, async (req, res) => {
    const lead = await storage.getLead(Number(req.params.id));
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  });

  // Update Lead
  app.patch(api.leads.update.path, async (req, res) => {
    try {
      const updates = api.leads.update.input.parse(req.body);
      const lead = await storage.updateLead(Number(req.params.id), updates);
      res.json(lead);
    } catch (err) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  // Retell Webhook
  app.post(api.webhooks.retell.path, async (req, res) => {
    try {
      // Basic handling of Retell webhook
      const payload = req.body;
      
      console.log("Received Retell Webhook:", JSON.stringify(payload, null, 2));

      // Extract key info (adapting to common Retell payloads)
      // Note: Actual payload structure depends on Retell event type (call_analyzed, etc.)
      const event = payload.event;
      const callId = payload.call_id;
      const agentId = payload.agent_id;
      
      if (callId) {
        // Check if lead exists by callId
        let lead = await storage.getLeadByRetellCallId(callId);
        
        const analysis = payload.call_analysis || {};
        const transcript = payload.transcript || "";
        
        // Map Retell status/sentiment to our status
        let status = "New";
        if (analysis.user_sentiment === "Positive") status = "Qualified";
        if (analysis.call_successful) status = "Converted";

        const leadData = {
          retellCallId: callId,
          retellAgentId: agentId,
          // If we have caller info, update it. Retell often passes this in call object
          phone: payload.from_number || "Unknown", 
          name: analysis.custom_analysis_data?.name || "AI Lead",
          caseType: analysis.custom_analysis_data?.case_type || "General",
          urgency: analysis.custom_analysis_data?.urgency || "Medium",
          summary: analysis.call_summary,
          transcript: transcript,
          status: status,
        };

        if (lead) {
          // Update existing lead
          await storage.updateLead(lead.id, leadData);
        } else {
          // Create new lead
          lead = await storage.createLead(leadData);
        }

        // Log the call
        await storage.createCallLog({
          leadId: lead.id,
          retellCallId: callId,
          agentId: agentId,
          phoneNumber: payload.from_number,
          status: payload.call_status || "completed",
          duration: payload.duration_ms ? Math.round(payload.duration_ms / 1000) : 0,
          recordingUrl: payload.recording_url,
          analysis: analysis
        });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Webhook Error:", err);
      // Return 200 to acknowledge receipt even on error to prevent retries loop if logic fails
      res.status(200).json({ success: false, error: "Internal processing error" });
    }
  });

  // Seed Data if empty
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getLeads();
  if (existing.length === 0) {
    console.log("Seeding database...");
    await storage.createLead({
      name: "Juan Perez",
      phone: "+15550101",
      caseType: "Accidente de Tráfico",
      urgency: "High",
      status: "New",
      summary: "Cliente tuvo un accidente ayer. Necesita asesoría urgente.",
      retellCallId: "call_123456"
    });
    
    await storage.createLead({
      name: "Maria Garcia",
      phone: "+15550102",
      caseType: "Derecho Laboral",
      urgency: "Medium",
      status: "Qualified",
      summary: "Despido injustificado. Busca compensación.",
      retellCallId: "call_789012"
    });

    await storage.createLead({
      name: "Carlos Rodriguez",
      phone: "+15550103",
      caseType: "Divorcio",
      urgency: "Low",
      status: "Converted",
      summary: "Quiere iniciar trámites de divorcio de mutuo acuerdo.",
      retellCallId: "call_345678"
    });
    console.log("Seeding complete.");
  }
}
