export function compactStatusNotice(text: string, maxChars = 42): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (normalized.length <= maxChars) return normalized;

  const limit = Math.max(4, maxChars - 3);
  const wordBoundary = normalized.lastIndexOf(' ', limit);
  const cutAt = wordBoundary >= Math.ceil(maxChars * 0.55) ? wordBoundary : limit;
  return `${normalized.slice(0, cutAt).trimEnd()}...`;
}

export function overlayButtonWidth(label: string): number {
  return label.length > 9 ? 230 : 170;
}

export function placementHintCopy(label: string): string {
  return `PLACING ${label.toUpperCase()}\nTap map to place / banner to cancel`;
}

export function sidePanelBodyTextWidth(panelWidth: number): number {
  return Math.max(120, panelWidth - 36);
}
