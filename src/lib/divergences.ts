import type { ManifestItem } from "./manifest";

export type ItemDifference = {
  field: string;
  expected: string;
  received: string;
};

export function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function cleanText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim();
}

export function normalizeContainer(value: unknown): string {
  return cleanText(value).toUpperCase();
}

export function buildItemDifferences(i: ManifestItem): ItemDifference[] {
  const rows: ItemDifference[] = [];
  const seen = new Set<string>();
  const add = (campo: string, expected: unknown, received: unknown) => {
    const key = cleanText(campo).toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    rows.push({
      field: campo,
      expected: cleanText(expected),
      received: cleanText(received),
    });
  };

  if (
    hasValue(i.quantidadeEsperada) &&
    hasValue(i.quantidadeRecebida) &&
    Number(i.quantidadeEsperada) !== Number(i.quantidadeRecebida)
  ) {
    add("Quantidade", i.quantidadeEsperada, i.quantidadeRecebida);
  }

  if (
    hasValue(i.pesoEsperado) &&
    hasValue(i.pesoRecebido) &&
    Number(i.pesoEsperado) !== Number(i.pesoRecebido)
  ) {
    add("Peso", i.pesoEsperado, i.pesoRecebido);
  }

  if (
    hasValue(i.containerEsperado) &&
    hasValue(i.containerRecebido) &&
    normalizeContainer(i.containerEsperado) !== normalizeContainer(i.containerRecebido)
  ) {
    add("Contêiner", i.containerEsperado, i.containerRecebido);
  }

  if (
    rows.length === 0 &&
    hasValue(i.campoDivergente) &&
    hasValue(i.valorEsperado) &&
    hasValue(i.valorRecebido)
  ) {
    add(cleanText(i.campoDivergente), i.valorEsperado, i.valorRecebido);
  }

  return rows;
}
