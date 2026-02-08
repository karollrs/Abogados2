import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useCallLogs } from "@/hooks/use-call-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Phone, Clock, FileText, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useSearchParams } from "react-router-dom";

function formatDuration(seconds?: number | null) {
  const s = Math.max(0, Number(seconds ?? 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

function safeJson(obj: any) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "";
  }
}

// Badge de estado más “amigable”
function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? "ended").toLowerCase();

  if (s.includes("complete") || s.includes("ended") || s.includes("success")) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-300">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        {status ?? "ended"}
      </span>
    );
  }

  if (s.includes("fail") || s.includes("error")) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        {status ?? "failed"}
      </span>
    );
  }

  if (s.includes("progress") || s.includes("ongoing") || s.includes("active")) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
        {status ?? "in_progress"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
      {status ?? "unknown"}
    </span>
  );
}

export default function CallLogs() {
  const { data: logs, isLoading, error } = useCallLogs();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [autoOpened, setAutoOpened] = useState(false);

  const phoneFromUrl = searchParams.get("phone");

  // ✅ Auto-abrir detalle si llegas desde Dashboard con ?phone=
  useEffect(() => {
  if (!phoneFromUrl) return;
  if (!logs?.length) return;
  if (autoOpened) return; // ✅ evita que se reabra

  const normalize = (s: string) => (s || "").replace(/[^\d+]/g, "");
  const target = normalize(phoneFromUrl);

  const match = [...logs]
    .sort(
      (a: any, b: any) =>
        (b.createdAt ?? b.created_at ?? 0) - (a.createdAt ?? a.created_at ?? 0)
    )
    .find((l: any) => normalize(l.phoneNumber ?? "") === target);

  if (match) {
    setSelected(match);
    setOpen(true);
    setAutoOpened(true); // ✅ ya abrió una vez
  }
}, [phoneFromUrl, logs, autoOpened]);


  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="md:pl-64">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Call Logs</h1>
              <p className="text-muted-foreground">
                Historial de llamadas con resumen, análisis y transcripción
              </p>
            </div>
          </div>

          {/* Card principal */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Llamadas
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0">
              {isLoading && <div className="text-muted-foreground">Cargando…</div>}

              {error && (
                <div className="text-destructive">
                  Error cargando call logs: {(error as any)?.message}
                </div>
              )}

              {!isLoading && !error && (!logs || logs.length === 0) && (
                <div className="text-muted-foreground">
                  Aún no hay llamadas guardadas.
                </div>
              )}

              {/* LISTA vertical uniforme */}
              <div className="flex flex-col gap-6">
                {logs?.map((l: any) => (
                  <div
                    key={l.id}
                    className="
                      group
                      rounded-2xl
                      border border-border/50
                      bg-card/60
                      p-5
                      shadow-sm
                      hover:shadow-md
                      hover:bg-card
                      transition
                    "
                  >
                    {/* HEADER */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold truncate">
                            {l.leadName ?? "AI Lead"}
                          </span>
                          <StatusBadge status={l.status ?? "ended"} />
                        </div>
                      </div>

                      {/* Ver detalle */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(l);
                          setOpen(true);
                        }}
                        className="
                          inline-flex items-center
                          rounded-lg
                          px-3 py-1.5
                          text-sm
                          text-muted-foreground
                          hover:text-foreground
                          hover:bg-muted/60
                          transition
                          shrink-0
                        "
                      >
                        Ver detalles →
                      </button>
                    </div>

                    {/* METADATA */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4 opacity-70" />
                        {l.phoneNumber ?? "Web Call"}
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4 opacity-70" />
                        {formatDuration(l.duration)}
                      </span>

                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4 opacity-70" />
                        {l.summary ? "Con resumen" : "Sin resumen"}
                      </span>
                    </div>

                    {/* RESUMEN */}
                    <div className="mt-3 text-sm text-foreground/80 leading-relaxed line-clamp-2 min-h-[2.75rem]">
                      {l.summary ?? "Sin resumen disponible para esta llamada."}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Dialog detalle */}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);

          // Si se está cerrando, limpia el query param para que no se reabra
          if (!next) {
            const sp = new URLSearchParams(searchParams);
            sp.delete("phone");
            setSearchParams(sp, { replace: true });
            setSelected(null);
          }
        }}
      >

        <DialogContent className="max-w-4xl p-0">
          <div className="flex max-h-[85vh] flex-col">
            {/* Header fijo */}
            <div className="border-b px-6 py-4">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  Detalle de llamada
                </DialogTitle>
              </DialogHeader>

              {selected && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  {/* Estado */}
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {selected.status ?? "ended"}
                  </span>

                  {/* Duración */}
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 opacity-60" />
                    {formatDuration(selected.duration)}
                  </span>

                  {/* Teléfono */}
                  {selected.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4 opacity-60" />
                      {selected.phoneNumber}
                    </span>
                  )}

                  {/* Lead */}
                  {selected.leadName && (
                    <span className="font-medium text-foreground">
                      {selected.leadName}
                    </span>
                  )}

                  {/* Caso */}
                  {selected.caseType && (
                    <span>
                      Caso:{" "}
                      <span className="text-foreground">{selected.caseType}</span>
                    </span>
                  )}

                  {/* Urgencia */}
                  {selected.urgency && (
                    <span>
                      Urgencia:{" "}
                      <span className="font-medium text-foreground">
                        {selected.urgency}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!selected ? (
                <div className="text-muted-foreground">Selecciona una llamada.</div>
              ) : (
                <Tabs defaultValue="resumen" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 rounded-xl">
                    <TabsTrigger value="resumen" className="rounded-lg">
                      Resumen
                    </TabsTrigger>
                    <TabsTrigger value="transcripcion" className="rounded-lg">
                      Transcripción
                    </TabsTrigger>
                    <TabsTrigger value="analisis" className="rounded-lg">
                      Análisis
                    </TabsTrigger>
                    <TabsTrigger
                      value="audio"
                      className="rounded-lg"
                      disabled={!selected.recordingUrl}
                    >
                      Audio
                    </TabsTrigger>
                  </TabsList>

                  {/* RESUMEN */}
                  <TabsContent value="resumen" className="mt-4 space-y-4">
                    <Card className="rounded-2xl border-border/60 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Resumen</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-foreground/80 leading-relaxed">
                        {selected.summary ??
                          selected.analysis?.call_summary ??
                          "Sin resumen (aún)."}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* TRANSCRIPCIÓN */}
                  <TabsContent value="transcripcion" className="mt-4">
                    <Card className="rounded-2xl border-border/60 shadow-sm">
                      <CardHeader className="flex-row items-center justify-between">
                        <CardTitle className="text-base">Transcripción</CardTitle>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selected.transcript ?? "");
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                          }}
                          disabled={!selected.transcript}
                          className="
                            inline-flex items-center gap-2
                            rounded-lg
                            px-3 py-1.5
                            text-sm
                            text-muted-foreground
                            hover:text-foreground
                            hover:bg-muted/60
                            transition
                            disabled:opacity-40
                            disabled:cursor-not-allowed
                          "
                        >
                          <Copy className="h-4 w-4" />
                          {copied ? "Copiado" : "Copiar"}
                        </button>
                      </CardHeader>

                      <CardContent>
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                          {selected.transcript ?? "Sin transcripción (aún)."}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ANÁLISIS */}
                  <TabsContent value="analisis" className="mt-4">
                    <Card className="rounded-2xl border-border/60 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Análisis</CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <Separator />
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                                <div className="text-xs text-muted-foreground">
                                  Sentimiento
                                </div>
                                <div className="font-medium">
                                  {selected.analysis?.user_sentiment ?? "—"}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                                <div className="text-xs text-muted-foreground">
                                  Exitosa
                                </div>
                                <div className="font-medium">
                                  {String(selected.analysis?.call_successful ?? "—")}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                                <div className="text-xs text-muted-foreground">
                                  Latencia
                                </div>
                                <div className="font-medium">
                                  {selected.analysis?.latency_ms
                                    ? `${selected.analysis.latency_ms} ms`
                                    : "—"}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                                <div className="text-xs text-muted-foreground">
                                  Motivo desconexión
                                </div>
                                <div className="font-medium">
                                  {selected.analysis?.disconnect_reason ?? "—"}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                              <div className="text-xs text-muted-foreground mb-2">
                                Resumen IA
                              </div>
                              <div className="leading-relaxed text-foreground/80">
                                {selected.analysis?.call_summary ?? "—"}
                              </div>
                            </div>

                            {/* (Opcional) JSON técnico para debug - si lo quieres oculto, bórralo */}
                            {/* <pre className="text-xs whitespace-pre-wrap">{safeJson(selected.analysis ?? {})}</pre> */}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* AUDIO */}
                  <TabsContent value="audio" className="mt-4">
                    <Card className="rounded-2xl border-border/60 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Audio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selected.recordingUrl ? (
                          <audio controls className="w-full">
                            <source src={selected.recordingUrl} />
                          </audio>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No hay audio disponible.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
