import type { AnalysisResult } from "./manifest";

const KEY = "nexusCargo:history";
const LAST_KEY = "nexusCargo:lastAnalysis";
const LEGACY_KEYS = ["nexuscargo:history"];

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function migrateHistoryItems(items: AnalysisResult[]): { items: AnalysisResult[]; changed: boolean } {
  let changed = false;
  const migrated = items.map((item) => {
    if (!item || typeof item !== "object") return item;
    if (!item.id) {
      changed = true;
      return { ...item, id: genId() };
    }
    return item;
  });
  return { items: migrated, changed };
}

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
    const list = Array.isArray(parsed) ? (parsed as AnalysisResult[]) : [];
    const { items, changed } = migrateHistoryItems(list);
    if (changed) {
      window.localStorage.setItem(KEY, JSON.stringify(items));
    }
    return items;
  } catch {
    return [];
  }
}

export function getHistoryItemById(id: string): AnalysisResult | null {
  const normalized = (() => {
    try {
      return decodeURIComponent(String(id));
    } catch {
      return String(id);
    }
  })();
  return loadHistory().find((a) => String(a.id) === normalized) ?? null;
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
