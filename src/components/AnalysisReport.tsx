import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Container,
  Filter,
  Package,
  Percent,
  Search,
  Weight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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

import {
  computeKpis,
  isFullyConforming,
  isOk,
  isRenderable,
  itemStatus,
  type AnalysisResult,
  type ManifestItem,
} from "@/lib/manifest";
import { buildItemDifferences } from "@/lib/divergences";

export function AnalysisReport({ result }: { result: AnalysisResult }) {
  const kpis = useMemo(() => computeKpis(result.items), [result.items]);
  const conforming = isFullyConforming(result.items);

  return (
    <div className="space-y-6">
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
        <TabsList className={`grid w-full sm:w-auto ${conforming ? "grid-cols-2" : "grid-cols-3"}`}>
          <TabsTrigger value="itens">Itens</TabsTrigger>
          {!conforming && <TabsTrigger value="divergencias">Divergências</TabsTrigger>}
          <TabsTrigger value="info">Manifesto</TabsTrigger>
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

export function StatusBadge({ status }: { status: string }) {
  if (isOk(status)) {
    return (
      <Badge className="border-transparent bg-success/20 text-success hover:bg-success/25">
        {status || "OK"}
      </Badge>
    );
  }
  const lower = status.toLowerCase();
  const tone =
    lower.includes("crítico") || lower.includes("critico") || lower.includes("erro")
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
                  <TableCell className="text-right font-mono text-xs">{i.quantidade ?? "-"}</TableCell>
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
        const rows = buildItemDifferences(i);
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
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Os valores comparativos não estavam disponíveis nesta análise.
              </p>
            ) : (
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
            )}
          </Card>
        );
      })}
    </div>
  );
}

function InfoPanel({
  info,
  containers,
}: {
  info: Record<string, string | number>;
  containers: string[];
}) {
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
