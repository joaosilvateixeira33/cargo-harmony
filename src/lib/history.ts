import type { AnalysisResult } from "./manifest";

const KEY = "nexusCargo:history";
const LAST_KEY = "nexusCargo:lastAnalysis";
const LEGACY_KEYS = ["nexuscargo:history"];

export function loadHistory(): AnalysisResult[] {
  if (typeof window === "undefined") return [];
  try {
    let raw = window.localStorage.getItem(KEY);
    if (!raw) {
      // migrate from legacy key(s) once
      for (const legacy of LEGACY_KEYS) {
        const legacyRaw = window.localStorage.getItem(legacy);
        if (legacyRaw) {
          window.localStorage.setItem(KEY, legacyRaw);
          window.localStorage.removeItem(legacy);
          raw = legacyRaw;
          break;
        }
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getHistoryItemById(id: string): AnalysisResult | null {
  return loadHistory().find((a) => a.id === id) ?? null;
}

export function saveAnalysis(result: AnalysisResult) {
  if (typeof window === "undefined") return;
  const list = loadHistory();
  list.unshift(result);
  const trimmed = list.slice(0, 50);
  window.localStorage.setItem(KEY, JSON.stringify(trimmed));
  window.localStorage.setItem(LAST_KEY, JSON.stringify(result));
  window.dispatchEvent(new Event("nexuscargo:history-updated"));
}

export function deleteAnalysis(id: string) {
  const list = loadHistory().filter((a) => a.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("nexuscargo:history-updated"));
}

export function clearHistory() {
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(LAST_KEY);
  for (const legacy of LEGACY_KEYS) window.localStorage.removeItem(legacy);
  window.dispatchEvent(new Event("nexuscargo:history-updated"));
}

export function clearTestHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(LAST_KEY);
  window.dispatchEvent(new Event("nexuscargo:history-updated"));
}
