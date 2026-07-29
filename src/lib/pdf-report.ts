import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  computeKpis,
  isOk,
  itemStatus,
  type AnalysisResult,
  type ManifestItem,
} from "./manifest";
import { buildItemDifferences } from "./divergences";

const NAVY = [22, 40, 66] as const;
const CYAN = [45, 156, 200] as const;
const GREEN = [56, 161, 105] as const;
const RED = [220, 90, 90] as const;
const MUTED = [110, 120, 135] as const;

function drawLogo(doc: jsPDF, x: number, y: number) {
  doc.setFillColor(...NAVY);
  doc.roundedRect(x, y, 32, 32, 6, 6, "F");
  doc.setFillColor(...CYAN);
  doc.circle(x + 16, y + 16, 8, "F");
  doc.setFillColor(255, 255, 255);
  doc.circle(x + 16, y + 16, 3, "F");
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("NexusCargo", x + 40, y + 14);
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.text("Análise inteligente de manifestos de carga", x + 40, y + 24);
}

function addFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...MUTED);
    doc.setLineWidth(0.2);
    doc.line(40, h - 30, w - 40, h - 30);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`NexusCargo · Relatório de Manifesto`, 40, h - 18);
    doc.text(`Página ${i} de ${pages}`, w - 40, h - 18, { align: "right" });
  }
}

export function generatePdfReport(result: AnalysisResult) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const kpis = computeKpis(result.items);

  drawLogo(doc, 40, 40);
  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")}`,
    w - 40,
    52,
    { align: "right" },
  );
  doc.text(`Arquivo: ${result.filename}`, w - 40, 66, { align: "right" });

  // Executive summary
  let y = 100;
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Resumo executivo", 40, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 66, 78);
  const summary =
    kpis.divergences === 0 && kpis.total > 0
      ? `Manifesto 100% conforme. ${kpis.total} itens analisados, distribuídos em ${kpis.containers} contêiner(es), totalizando ${kpis.totalQuantity} unidades e ${kpis.totalWeight} kg. Nenhuma divergência foi identificada.`
      : `Foram analisados ${kpis.total} itens em ${kpis.containers} contêiner(es). Identificadas ${kpis.divergences} divergência(s), resultando em ${kpis.conformity.toFixed(1)}% de conformidade. Volume total: ${kpis.totalQuantity} unidades / ${kpis.totalWeight} kg.`;
  const lines = doc.splitTextToSize(summary, w - 80);
  doc.text(lines, 40, y);
  y += lines.length * 12 + 10;

  // KPIs grid
  const kpiData: Array<[string, string]> = [
    ["Total de itens", String(kpis.total)],
    ["Itens corretos", String(kpis.okCount)],
    ["Divergências", String(kpis.divergences)],
    ["Conformidade", `${kpis.conformity.toFixed(1)}%`],
    ["Quantidade total", String(kpis.totalQuantity)],
    ["Peso total (kg)", String(kpis.totalWeight)],
    ["Contêineres", String(kpis.containers)],
  ];
  const cellW = (w - 80) / 4;
  const cellH = 46;
  kpiData.forEach((k, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 40 + col * cellW;
    const cy = y + row * (cellH + 8);
    doc.setFillColor(245, 248, 252);
    doc.roundedRect(x, cy, cellW - 8, cellH, 4, 4, "F");
    doc.setTextColor(...MUTED);
    doc.setFontSize(8);
    doc.text(k[0].toUpperCase(), x + 10, cy + 14);
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(k[1], x + 10, cy + 34);
    doc.setFont("helvetica", "normal");
  });
  y += Math.ceil(kpiData.length / 4) * (cellH + 8) + 10;

  // Manifest info
  const infoEntries = Object.entries(result.info);
  if (infoEntries.length) {
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Informações do manifesto", 40, y);
    y += 6;
    autoTable(doc, {
      startY: y + 4,
      head: [["Campo", "Valor"]],
      body: infoEntries.map(([k, v]) => [k, String(v)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [NAVY[0], NAVY[1], NAVY[2]] as [number, number, number] },
      margin: { left: 40, right: 40 },
    });
    y = (doc as any).lastAutoTable.finalY + 16;
  }

  // Items table
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Itens do manifesto", 40, y);
  autoTable(doc, {
    startY: y + 6,
    head: [["Código", "Descrição", "Qtd.", "Peso", "Contêiner", "Status"]],
    body: result.items.map((i) => [
      String(i.codigo ?? ""),
      String(i.descricao ?? ""),
      String(i.quantidade ?? ""),
      String(i.peso ?? ""),
      String(i.container ?? ""),
      itemStatus(i) || "-",
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [NAVY[0], NAVY[1], NAVY[2]] as [number, number, number] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const status = String(data.cell.raw ?? "");
        if (isOk(status)) {
          data.cell.styles.textColor = [GREEN[0], GREEN[1], GREEN[2]] as [number, number, number];
          data.cell.styles.fontStyle = "bold";
        } else if (status) {
          data.cell.styles.textColor = [RED[0], RED[1], RED[2]] as [number, number, number];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { left: 40, right: 40 },
  });
  y = (doc as any).lastAutoTable.finalY + 16;

  // Divergences detail
  const divs = result.items.filter((i) => !isOk(itemStatus(i)));
  if (divs.length) {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Divergências detalhadas", 40, y);
    autoTable(doc, {
      startY: y + 6,
      head: [["Código", "Campo", "Esperado", "Recebido"]],
      body: divs.flatMap((i) => rowsForDivergence(i)),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [RED[0], RED[1], RED[2]] as [number, number, number] },
      margin: { left: 40, right: 40 },
    });
  }

  addFooter(doc);
  const safe = result.filename.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "_");
  doc.save(`nexuscargo-${safe || "relatorio"}.pdf`);
}

function rowsForDivergence(i: ManifestItem): string[][] {
  const rows: string[][] = [];
  const code = String(i.codigo ?? "-");
  if (i.quantidadeEsperada != null || i.quantidadeRecebida != null) {
    rows.push([code, "Quantidade", String(i.quantidadeEsperada ?? "-"), String(i.quantidadeRecebida ?? i.quantidade ?? "-")]);
  }
  if (i.pesoEsperado != null || i.pesoRecebido != null) {
    rows.push([code, "Peso", String(i.pesoEsperado ?? "-"), String(i.pesoRecebido ?? i.peso ?? "-")]);
  }
  if (i.containerEsperado != null || i.containerRecebido != null) {
    rows.push([code, "Contêiner", String(i.containerEsperado ?? "-"), String(i.containerRecebido ?? i.container ?? "-")]);
  }
  if (i.campoDivergente) {
    rows.push([code, String(i.campoDivergente), String(i.valorEsperado ?? "-"), String(i.valorRecebido ?? "-")]);
  }
  if (!rows.length) {
    rows.push([code, "Status", "OK", itemStatus(i) || "-"]);
  }
  return rows;
}
