import type { AnalysisResult } from "./manifest";

const KEY = "nexuscargo:history";

export function loadHistory(): AnalysisResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAnalysis(result: AnalysisResult) {
  if (typeof window === "undefined") return;
  const list = loadHistory();
  list.unshift(result);
  const trimmed = list.slice(0, 50);
  window.localStorage.setItem(KEY, JSON.stringify(trimmed));
  window.dispatchEvent(new Event("nexuscargo:history-updated"));
}

export function deleteAnalysis(id: string) {
  const list = loadHistory().filter((a) => a.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("nexuscargo:history-updated"));
}

export function clearHistory() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("nexuscargo:history-updated"));
}
