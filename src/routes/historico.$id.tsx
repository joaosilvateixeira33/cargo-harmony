import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Download, Eye, FileDown, Info, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getHistoryItemById } from "@/lib/history";
import { generatePdfReport } from "@/lib/pdf-report";
import { downloadCsv, downloadJson } from "@/lib/downloads";
import type { AnalysisResult } from "@/lib/manifest";
import { AnalysisReport } from "@/components/AnalysisReport";

export const Route = createFileRoute("/historico/$id")({
  head: () => ({
    meta: [
      { title: "Análise salva — NexusCargo" },
      {
        name: "description",
        content:
          "Visualize uma análise salva no histórico com KPIs, itens e divergências.",
      },
      { property: "og:title", content: "Análise salva — NexusCargo" },
      {
        property: "og:description",
        content: "Reveja os dados de uma análise armazenada no histórico.",
      },
    ],
  }),
  component: HistoryAnalysisPage,
});

function HistoryAnalysisPage() {
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
        Carregando análise…
      </div>
    );
  }

  if (result === null) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <Card className="p-10 text-center">
          <h1 className="text-xl font-semibold">Relatório não encontrado.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A análise pode ter sido removida ou não está mais disponível no histórico.
          </p>
          <div className="mt-6">
            <Link to="/historico">
              <Button type="button">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao histórico
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-10">
      <Card className="mb-4 flex items-start gap-3 border-primary/30 bg-primary/5 p-4">
        <Info className="mt-0.5 h-5 w-5 text-primary" />
        <p className="text-sm">
          Você está visualizando uma análise salva no histórico.
        </p>
      </Card>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{result.filename}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(result.createdAt).toLocaleString("pt-BR")}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/historico" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao histórico
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              navigate({ to: "/historico/$id/relatorio", params: { id: result.id } })
            }
          >
            <Eye className="mr-2 h-4 w-4" />
            Rever relatório
          </Button>
          <Button type="button" size="sm" onClick={() => generatePdfReport(result)}>
            <FileDown className="mr-2 h-4 w-4" />
            Gerar PDF
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => downloadJson(result)}>
            <Download className="mr-2 h-4 w-4" />
            Baixar JSON
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => downloadCsv(result)}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/" })}
          >
            <Upload className="mr-2 h-4 w-4" />
            Analisar novo manifesto
          </Button>
        </div>
      </div>

      <AnalysisReport result={result} />
    </div>
  );
}
