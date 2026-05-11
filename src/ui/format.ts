export function formatInteger(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function formatCompactNumber(value: number): string {
  const rounded = Math.round(value);
  const abs = Math.abs(rounded);
  if (abs >= 1_000_000) return `${trimFixed(rounded / 1_000_000, 1)}M`;
  if (abs >= 10_000) return `${trimFixed(rounded / 1_000, 1)}K`;
  return rounded.toLocaleString('en-US');
}

function trimFixed(value: number, digits: number): string {
  return value.toFixed(digits).replace(/\.0$/, '');
}
