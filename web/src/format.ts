const SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  INR: "₹",
  SGD: "S$",
  BRL: "R$",
  CAD: "CA$",
  AUD: "A$",
};

export function formatMoney(amount: string, currency: string): string {
  const negative = amount.startsWith("-");
  const [whole, fraction = "00"] = amount.replace("-", "").split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cents = fraction.padEnd(2, "0").slice(0, 2);
  const symbol = SYMBOLS[currency] ?? `${currency} `;
  return `${negative ? "-" : ""}${symbol}${grouped}.${cents}`;
}

export function formatUsd(amount: string): string {
  return formatMoney(amount, "USD");
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function barPercent(value: string, max: string): string {
  const width = Math.max(0, Math.min(100, (Number(value) / Number(max)) * 100));
  if (!Number.isFinite(width)) return "0%";
  return `${width}%`;
}
