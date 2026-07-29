import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Package,
  Weight,
  Container,
  Percent,
  Search,
  Filter,
  Download,
  FileDown,
  RefreshCw,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

import {
  computeKpis,
  isFullyConforming,
  isOk,
  isRenderable,
  itemStatus,
  sendManifest,
  toCsv,
  type AnalysisResult,
  type ManifestItem,
} from "@/lib/manifest";
import { saveAnalysis } from "@/lib/history";
import { generatePdfReport } from "@/lib/pdf-report";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NexusCargo — Nova análise de manifesto" },
      {
        name: "description",
        content:
          "Envie manifestos PDF, imagem ou planilha e obtenha análise instantânea de conformidade, divergências e relatório executivo.",
      },
      { property: "og:title", content: "NexusCargo — Nova análise de manifesto" },
      {
        property: "og:description",
        content: "Análise em tempo real com KPIs e relatório PDF.",
      },
    ],
  }),
  component: IndexPage,
});

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.xls,.xlsx";

function IndexPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (file: File | null) => {
    if (!file) return;
    const validExts = ["pdf", "png", "jpg", "jpeg", "xls", "xlsx"];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!validExts.includes(ext)) {
      toast.error("Formato inválido. Envie PDF, PNG, JPG, JPEG, XLS ou XLSX.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { items, info, webhook } = await sendManifest(file);
      const analysis: AnalysisResult = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        filename: file.name,
        createdAt: new Date().toISOString(),
        items,
        info,
        webhook,
      };
      setResult(analysis);
      saveAnalysis(analysis);
      toast.success(`Manifesto analisado: ${items.length} itens`);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao enviar manifesto ao webhook.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFiles(file ?? null);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-10">
      {!result && (
        <div className="space-y-8">
          <header className="text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Análise inteligente de manifestos
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Envie um manifesto de carga para conferência automática de conformidade,
              divergências e relatórios prontos para operação.
            </p>
          </header>

          <Card
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`mx-auto max-w-3xl border-2 border-dashed bg-card/70 p-10 text-center backdrop-blur transition ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Upload className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">
              Arraste o manifesto ou clique para selecionar
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Formatos aceitos: PDF, PNG, JPG, JPEG, XLS, XLSX
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Button
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analisando…
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Selecionar arquivo
                  </>
                )}
              </Button>
              <Link to="/historico">
                <Button variant="outline" size="lg">
                  <Clock className="mr-2 h-4 w-4" />
                  Ver histórico
                </Button>
              </Link>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files?.[0] ?? null)}
            />
          </Card>

          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 text-xs text-muted-foreground sm:grid-cols-3">
            <FeatureLine icon={<ShieldCheck className="h-4 w-4" />} text="Análise de conformidade em tempo real" />
            <FeatureLine icon={<AlertTriangle className="h-4 w-4" />} text="Detecção de divergências campo a campo" />
            <FeatureLine icon={<FileDown className="h-4 w-4" />} text="Relatórios em PDF, JSON e CSV" />
          </div>
        </div>
      )}

      {result && <ResultsView result={result} onReset={() => setResult(null)} />}
    </div>
  );
}

function FeatureLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2 backdrop-blur">
      <span className="text-primary">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function ResultsView({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const kpis = useMemo(() => computeKpis(result.items), [result.items]);
  const conforming = isFullyConforming(result.items);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {result.filename}
          </h1>
          <p className="text-xs text-muted-foreground">
            Analisado em {new Date(result.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Analisar outro manifesto
          </Button>
          <Button size="sm" onClick={() => generatePdfReport(result)}>
            <FileDown className="mr-2 h-4 w-4" />
            Gerar relatório PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadJson(result)}>
            <Download className="mr-2 h-4 w-4" />
            Baixar JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadCsv(result)}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {conforming ? (
        <Card className="border-success/40 bg-success/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 text-success" />
            <div>
              <h2 className="text-lg font-semibold text-success">
                Manifesto 100% conforme
              </h2>
              <p className="text-sm text-muted-foreground">
                Nenhuma divergência foi identificada.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Kpi label="Total de itens" value={kpis.total} icon={<Package className="h-4 w-4" />} />
        <Kpi label="Itens corretos" value={kpis.okCount} tone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        <Kpi label="Divergências" value={kpis.divergences} tone={kpis.divergences > 0 ? "destructive" : undefined} icon={<AlertTriangle className="h-4 w-4" />} />
        <Kpi label="Conformidade" value={`${kpis.conformity.toFixed(1)}%`} icon={<Percent className="h-4 w-4" />} />
        <Kpi label="Quantidade total" value={kpis.totalQuantity} icon={<Package className="h-4 w-4" />} />
        <Kpi label="Peso total" value={`${kpis.totalWeight}`} icon={<Weight className="h-4 w-4" />} />
        <Kpi label="Contêineres" value={kpis.containers} icon={<Container className="h-4 w-4" />} />
      </div>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Conformidade geral</span>
          <span className="font-mono text-foreground">{kpis.conformity.toFixed(1)}%</span>
        </div>
        <Progress value={kpis.conformity} />
      </Card>

      <Tabs defaultValue="itens" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="itens">Itens</TabsTrigger>
          {!conforming && <TabsTrigger value="divergencias">Divergências</TabsTrigger>}
          <TabsTrigger value="info">Manifesto</TabsTrigger>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
        </TabsList>

        <TabsContent value="itens" className="mt-4">
          <ItemsTable items={result.items} />
        </TabsContent>

        {!conforming && (
          <TabsContent value="divergencias" className="mt-4">
            <DivergencesPanel items={result.items} />
          </TabsContent>
        )}

        <TabsContent value="info" className="mt-4">
          <InfoPanel info={result.info} containers={kpis.containerList} />
        </TabsContent>

        <TabsContent value="webhook" className="mt-4">
          <WebhookPanel result={result} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "success" | "destructive";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : "text-foreground";
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
        <span className="truncate">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (isOk(status)) {
    return (
      <Badge className="border-transparent bg-success/20 text-success hover:bg-success/25">
        {status || "OK"}
      </Badge>
    );
  }
  const lower = status.toLowerCase();
  const tone = lower.includes("crítico") || lower.includes("critico") || lower.includes("erro")
    ? "bg-destructive/20 text-destructive"
    : lower.includes("aviso") || lower.includes("alert")
      ? "bg-warning/20 text-warning"
      : "bg-warning/15 text-warning";
  return <Badge className={`border-transparent ${tone}`}>{status || "Divergente"}</Badge>;
}

function ItemsTable({ items }: { items: ManifestItem[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "ok" | "div">("all");

  const filtered = items.filter((i) => {
    const okMatch =
      filter === "all" || (filter === "ok" ? isOk(itemStatus(i)) : !isOk(itemStatus(i)));
    if (!okMatch) return false;
    if (!q) return true;
    const hay = `${i.codigo ?? ""} ${i.descricao ?? ""} ${i.container ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código, descrição ou contêiner…"
            className="pl-8"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-full sm:w-52">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ok">Apenas conformes</SelectItem>
            <SelectItem value="div">Apenas divergentes</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="max-h-[560px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Peso</TableHead>
              <TableHead>Contêiner</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum item encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((i, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-xs">{String(i.codigo ?? "-")}</TableCell>
                  <TableCell>{String(i.descricao ?? "-")}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {i.quantidade ?? "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">{i.peso ?? "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{String(i.container ?? "-")}</TableCell>
                  <TableCell>
                    <StatusBadge status={itemStatus(i)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function DivergencesPanel({ items }: { items: ManifestItem[] }) {
  const divs = items.filter((i) => !isOk(itemStatus(i)));
  if (!divs.length) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Nenhuma divergência identificada.
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {divs.map((i, idx) => {
        const rows = buildDivergenceRows(i);
        return (
          <Card key={idx} className="border-destructive/30 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">
                  Código {String(i.codigo ?? "-")} · Contêiner {String(i.container ?? "-")}
                </div>
                <div className="truncate font-semibold">{String(i.descricao ?? "Item")}</div>
              </div>
              <StatusBadge status={itemStatus(i)} />
            </div>
            <div className="grid gap-2">
              {rows.map((r, j) => (
                <div
                  key={j}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 rounded-md border border-border bg-background/40 p-2 text-sm"
                >
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Campo</div>
                    <div className="font-medium">{r.field}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Esperado</div>
                    <div className="font-mono text-success">{r.expected}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Recebido</div>
                    <div className="font-mono text-destructive">{r.received}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function buildDivergenceRows(i: ManifestItem) {
  const rows: { field: string; expected: string; received: string }[] = [];
  const push = (field: string, expected: unknown, received: unknown) => {
    if (isRenderable(expected) || isRenderable(received)) {
      rows.push({
        field,
        expected: isRenderable(expected) ? String(expected) : "—",
        received: isRenderable(received) ? String(received) : "—",
      });
    }
  };
  push("Quantidade", i.quantidadeEsperada, i.quantidadeRecebida ?? i.quantidade);
  push("Peso", i.pesoEsperado, i.pesoRecebido ?? i.peso);
  push("Contêiner", i.containerEsperado, i.containerRecebido ?? i.container);
  if (i.campoDivergente) {
    push(String(i.campoDivergente), i.valorEsperado, i.valorRecebido);
  }
  if (!rows.length) {
    rows.push({ field: "Status", expected: "OK", received: itemStatus(i) || "Divergente" });
  }
  return rows;
}

function InfoPanel({ info, containers }: { info: Record<string, string | number>; containers: string[] }) {
  const entries = Object.entries(info).filter(([, v]) => isRenderable(v));
  if (containers.length && !entries.some(([k]) => k.toLowerCase().includes("cont"))) {
    entries.push(["Contêineres", containers.join(", ")]);
  }
  if (!entries.length) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Nenhuma informação adicional retornada pelo webhook.
      </Card>
    );
  }
  return (
    <Card className="p-4">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {entries.map(([k, v]) => (
          <div key={k} className="min-w-0 border-b border-border/40 pb-2 last:border-0">
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</dt>
            <dd className="truncate font-medium">{String(v)}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function WebhookPanel({ result }: { result: AnalysisResult }) {
  const w = result.webhook;
  const pretty = JSON.stringify(w.parsedResponse ?? w.rawResponse, null, 2);
  const copy = async () => {
    await navigator.clipboard.writeText(pretty);
    toast.success("JSON copiado");
  };
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetaCard icon={<Globe className="h-4 w-4" />} label="URL do webhook" value={w.url} mono />
        <MetaCard
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Status HTTP"
          value={`${w.status} ${w.statusText || ""}`.trim()}
        />
        <MetaCard icon={<Clock className="h-4 w-4" />} label="Tempo de execução" value={`${w.durationMs} ms`} />
        <MetaCard
          icon={<FileText className="h-4 w-4" />}
          label="Enviado em"
          value={new Date(w.sentAt).toLocaleString("pt-BR")}
        />
      </div>

      <Card className="p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Dados enviados (FormData)
        </div>
        <pre className="overflow-auto rounded-md bg-background/60 p-3 text-xs">
{JSON.stringify(w.requestPayload, null, 2)}
        </pre>
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resposta completa (JSON formatado)
          </div>
          <Button size="sm" variant="outline" onClick={copy}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar JSON
          </Button>
        </div>
        <pre className="max-h-[520px] overflow-auto rounded-md bg-background/60 p-3 text-xs">
{pretty}
        </pre>
      </Card>
    </div>
  );
}

function MetaCard({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className={`mt-1 truncate text-sm ${mono ? "font-mono" : "font-semibold"}`} title={value}>
        {value}
      </div>
    </Card>
  );
}

function downloadJson(result: AnalysisResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  triggerDownload(blob, `nexuscargo-${sanitize(result.filename)}.json`);
}
function downloadCsv(result: AnalysisResult) {
  const blob = new Blob([toCsv(result.items)], { type: "text/csv" });
  triggerDownload(blob, `nexuscargo-${sanitize(result.filename)}.csv`);
}
function sanitize(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "_") || "manifesto";
}
function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
