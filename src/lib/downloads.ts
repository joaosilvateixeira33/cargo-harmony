import { toCsv, type AnalysisResult } from "./manifest";

export function sanitizeFilename(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "_") || "manifesto";
}

export function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(result: AnalysisResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  triggerDownload(blob, `nexuscargo-${sanitizeFilename(result.filename)}.json`);
}

export function downloadCsv(result: AnalysisResult) {
  const blob = new Blob([toCsv(result.items)], { type: "text/csv" });
  triggerDownload(blob, `nexuscargo-${sanitizeFilename(result.filename)}.csv`);
}
