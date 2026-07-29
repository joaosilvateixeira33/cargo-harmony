import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Download,
  FileDown,
  Info,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getHistoryItemById } from "@/lib/history";
import { generatePdfReport } from "@/lib/pdf-report";
import { downloadCsv, downloadJson } from "@/lib/downloads";
import type { AnalysisResult } from "@/lib/manifest";
import { AnalysisReport } from "@/components/AnalysisReport";

export const Route = createFileRoute("/historico/$id/relatorio")({
  head: () => ({
    meta: [
      { title: "Relatório da análise — NexusCargo" },
      {
        name: "description",
        content:
          "Revise um relatório salvo no histórico, incluindo KPIs, divergências e informações do manifesto.",
      },
      { property: "og:title", content: "Relatório da análise — NexusCargo" },
      {
        property: "og:description",
        content: "Visualize novamente análises salvas no histórico.",
      },
    ],
  }),
  component: HistoricalReportPage,
});

function HistoricalReportPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<AnalysisResult | null | undefined>(undefined);

  useEffect(() => {
    const load = () => setResult(getHistoryItemById(id));
    load();
    window.addEventListener("nexuscargo:history-updated", load);
    return () => window.removeEventListener("nexuscargo:history-updated", load);
  }, [id]);

  if (result === undefined) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 text-sm text-muted-foreground">
        Carregando relatório…
      </div>
    );
  }

  if (result === null) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <Card className="p-10 text-center">
          <h1 className="text-xl font-semibold">Relatório não encontrado.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta análise pode ter sido removida do histórico.
          </p>
          <div className="mt-6">
            <Link to="/historico">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao histórico
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const processingMs = result.webhook?.durationMs;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-10">
      <Card className="mb-4 flex items-start gap-3 border-primary/30 bg-primary/5 p-4">
        <Info className="mt-0.5 h-5 w-5 text-primary" />
        <p className="text-sm">
          Você está visualizando um relatório salvo no histórico.
        </p>
      </Card>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {result.filename}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(result.createdAt).toLocaleString("pt-BR")}
            </span>
            {typeof processingMs === "number" && (
              <span>Processado em {(processingMs / 1000).toFixed(2)}s</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/historico" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao histórico
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
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/" })}>
            <Upload className="mr-2 h-4 w-4" />
            Analisar novo manifesto
          </Button>
        </div>
      </div>

      <AnalysisReport result={result} />
    </div>
  );
}
