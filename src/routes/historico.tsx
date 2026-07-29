import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, FileDown, Trash2, ArrowRight, Upload, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  clearHistory,
  deleteAnalysis,
  loadHistory,
} from "@/lib/history";
import {
  computeKpis,
  isFullyConforming,
  type AnalysisResult,
} from "@/lib/manifest";
import { generatePdfReport } from "@/lib/pdf-report";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de análises — NexusCargo" },
      {
        name: "description",
        content:
          "Consulte manifestos analisados anteriormente, revise KPIs e gere relatórios em PDF a qualquer momento.",
      },
      { property: "og:title", content: "Histórico de análises — NexusCargo" },
      {
        property: "og:description",
        content: "Acesse análises anteriores e gere relatórios sob demanda.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [items, setItems] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    const load = () => setItems(loadHistory());
    load();
    window.addEventListener("nexuscargo:history-updated", load);
    return () => window.removeEventListener("nexuscargo:history-updated", load);
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Histórico de análises
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} análise(s) armazenada(s) localmente neste dispositivo.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/">
            <Button size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Nova análise
            </Button>
          </Link>
          {items.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (confirm("Limpar todo o histórico?")) clearHistory();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar histórico
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <PackageSearch className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">
            Nenhuma análise no histórico
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Envie um manifesto para começar. Suas análises ficam salvas aqui.
          </p>
          <div className="mt-4">
            <Link to="/">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Analisar manifesto
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Itens</TableHead>
                <TableHead className="text-right">Divergências</TableHead>
                <TableHead className="text-right">Conformidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => {
                const k = computeKpis(a.items);
                const ok = isFullyConforming(a.items);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="max-w-[220px] truncate font-medium">
                      {a.filename}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {new Date(a.createdAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{k.total}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {k.divergences}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {k.conformity.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      {ok ? (
                        <Badge className="border-transparent bg-success/20 text-success">
                          Conforme
                        </Badge>
                      ) : (
                        <Badge className="border-transparent bg-destructive/20 text-destructive">
                          Divergente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generatePdfReport(a)}
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteAnalysis(a.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {items.length > 0 && (
        <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
          Dica: clique em <ArrowRight className="h-3 w-3" /> gerar o PDF a partir de qualquer
          análise anterior.
        </p>
      )}
    </div>
  );
}
