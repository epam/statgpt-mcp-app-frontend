// SDMX frequency code -> human label. (A = Annual, Q = Quarterly, M = Monthly.)
const FREQUENCY_LABELS: Record<string, string> = {
  A: "Annual",
  Q: "Quarterly",
  M: "Monthly",
};

export function frequencyLabel(freq?: string): string | undefined {
  if (!freq) return undefined;
  return FREQUENCY_LABELS[freq] ?? freq;
}
