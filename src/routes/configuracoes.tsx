import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clearTestHistory } from "@/lib/history";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — NexusCargo" },
      {
        name: "description",
        content: "Preferências e utilitários do NexusCargo.",
      },
      { property: "og:title", content: "Configurações — NexusCargo" },
      { property: "og:description", content: "Preferências e utilitários." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Utilitários e preferências locais deste dispositivo.
        </p>
      </header>

      <Card className="p-5">
        <h2 className="text-base font-semibold">Histórico de testes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Remove as chaves <code>nexusCargo:history</code> e{" "}
          <code>nexusCargo:lastAnalysis</code> do armazenamento local.
        </p>
        <div className="mt-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (!confirm("Limpar histórico de testes?")) return;
              clearTestHistory();
              toast.success("Histórico de testes removido");
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar histórico de testes
          </Button>
        </div>
      </Card>
    </div>
  );
}
