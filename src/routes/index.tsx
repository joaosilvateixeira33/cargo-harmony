import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import {
  Upload,
  FileText,
  AlertTriangle,
  Download,
  FileDown,
  RefreshCw,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { sendManifest, type AnalysisResult } from "@/lib/manifest";
import { saveAnalysis } from "@/lib/history";
import { generatePdfReport } from "@/lib/pdf-report";
import { downloadCsv, downloadJson } from "@/lib/downloads";
import { AnalysisReport } from "@/components/AnalysisReport";

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
        id: typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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

      {result && (
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
              <Button variant="outline" size="sm" onClick={() => setResult(null)}>
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

          <AnalysisReport result={result} />
        </div>
      )}
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
