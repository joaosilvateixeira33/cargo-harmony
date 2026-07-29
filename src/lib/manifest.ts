export const WEBHOOK_URL = "https://hook.us2.make.com/nai21ra5gqs646r6pksijeby7iyj7fuv";

export type ManifestItem = {
  codigo?: string | number;
  descricao?: string;
  quantidade?: number;
  peso?: number;
  container?: string;
  Status?: string;
  status?: string;
  campoDivergente?: string;
  valorEsperado?: string | number;
  valorRecebido?: string | number;
  quantidadeEsperada?: number;
  quantidadeRecebida?: number;
  pesoEsperado?: number;
  pesoRecebido?: number;
  containerEsperado?: string;
  containerRecebido?: string;
  [k: string]: unknown;
};

export type ManifestInfo = Record<string, string | number>;

export type WebhookReport = {
  url: string;
  status: number;
  statusText: string;
  durationMs: number;
  sentAt: string;
  requestPayload: {
    filename: string;
    mimetype: string;
    uploadDate: string;
    size: number;
  };
  rawResponse: string;
  parsedResponse: unknown;
};

export type AnalysisResult = {
  id: string;
  filename: string;
  createdAt: string;
  items: ManifestItem[];
  info: ManifestInfo;
  webhook: WebhookReport;
};

const OK_SET = new Set(["ok", "conforme", "100%conforme", "100conforme"]);

export function normalizeStatus(raw: unknown): string {
  if (raw == null) return "";
  return String(raw)
    .replace(/["'`\s]/g, "")
    .toLowerCase();
}

export function isOk(raw: unknown): boolean {
  const n = normalizeStatus(raw);
  return OK_SET.has(n) || n.startsWith("100");
}

export function itemStatus(item: ManifestItem): string {
  return String(item.Status ?? item.status ?? "").trim();
}

export function isRenderable(v: unknown): v is string | number {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0 && v !== "undefined" && v !== "null";
  if (typeof v === "number") return !Number.isNaN(v);
  return false;
}

export function extractItemsAndInfo(parsed: unknown): {
  items: ManifestItem[];
  info: ManifestInfo;
} {
  let items: ManifestItem[] = [];
  let info: ManifestInfo = {};

  if (Array.isArray(parsed)) {
    items = parsed as ManifestItem[];
  } else if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    const data = obj.data ?? obj.items ?? obj.result;
    if (Array.isArray(data)) {
      items = data as ManifestItem[];
    } else if (data && typeof data === "object" && Array.isArray((data as any).items)) {
      items = (data as any).items;
    }
    // gather info fields (scalar only)
    const knownInfoKeys = ["bl", "BL", "cliente", "Cliente", "navio", "Navio", "porto", "Porto", "data", "Data", "container", "Container", "containeres", "Containeres", "contêineres", "Contêineres"];
    for (const k of Object.keys(obj)) {
      if (k === "data" || k === "items" || k === "result" || k === "success" || k === "message") continue;
      const v = obj[k];
      if (isRenderable(v)) info[prettyKey(k)] = v;
      else if (Array.isArray(v) && v.every((x) => typeof x === "string" || typeof x === "number")) {
        info[prettyKey(k)] = v.join(", ");
      }
    }
    for (const k of knownInfoKeys) {
      if (obj[k] != null && isRenderable(obj[k])) info[prettyKey(k)] = obj[k] as string | number;
    }
  }

  return { items, info };
}

function prettyKey(k: string): string {
  const map: Record<string, string> = {
    bl: "BL",
    cliente: "Cliente",
    navio: "Navio",
    porto: "Porto",
    data: "Data",
    container: "Contêiner",
    containeres: "Contêineres",
    contêineres: "Contêineres",
  };
  return map[k.toLowerCase()] ?? k;
}

export async function sendManifest(file: File): Promise<{
  items: ManifestItem[];
  info: ManifestInfo;
  webhook: WebhookReport;
}> {
  const form = new FormData();
  const uploadDate = new Date().toISOString();
  form.append("file", file);
  form.append("filename", file.name);
  form.append("mimetype", file.type || "application/octet-stream");
  form.append("uploadDate", uploadDate);

  const started = performance.now();
  const res = await fetch(WEBHOOK_URL, { method: "POST", body: form });
  const durationMs = Math.round(performance.now() - started);
  const raw = await res.text();
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = raw;
  }

  const { items, info } = extractItemsAndInfo(parsed);

  const webhook: WebhookReport = {
    url: WEBHOOK_URL,
    status: res.status,
    statusText: res.statusText,
    durationMs,
    sentAt: uploadDate,
    requestPayload: {
      filename: file.name,
      mimetype: file.type || "application/octet-stream",
      uploadDate,
      size: file.size,
    },
    rawResponse: raw,
    parsedResponse: parsed,
  };

  return { items, info, webhook };
}

export function computeKpis(items: ManifestItem[]) {
  const total = items.length;
  const okCount = items.filter((i) => isOk(itemStatus(i))).length;
  const divergences = total - okCount;
  const conformity = total === 0 ? 0 : (okCount / total) * 100;
  const totalQuantity = items.reduce((a, i) => a + (Number(i.quantidade) || 0), 0);
  const totalWeight = items.reduce((a, i) => a + (Number(i.peso) || 0), 0);
  const containers = new Set(
    items.map((i) => String(i.container ?? "")).filter((s) => s.trim() !== ""),
  );
  return {
    total,
    okCount,
    divergences,
    conformity,
    totalQuantity,
    totalWeight,
    containers: containers.size,
    containerList: Array.from(containers),
  };
}

export function isFullyConforming(items: ManifestItem[]) {
  return items.length > 0 && items.every((i) => isOk(itemStatus(i)));
}

export function toCsv(items: ManifestItem[]): string {
  const headers = ["codigo", "descricao", "quantidade", "peso", "container", "status"];
  const rows = items.map((i) =>
    [i.codigo, i.descricao, i.quantidade, i.peso, i.container, itemStatus(i)]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}
