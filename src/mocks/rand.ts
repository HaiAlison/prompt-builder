/** Deterministic PRNG so SSR and client renders agree on mock data. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = ReturnType<typeof mulberry32>;

export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

const TOKEN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function token(rng: Rng, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TOKEN_CHARS[Math.floor(rng() * TOKEN_CHARS.length)];
  }
  return out;
}

/** Offset in minutes from a base UTC timestamp, formatted as ISO. */
export function isoAt(base: Date, minutesOffset: number): string {
  return new Date(base.getTime() + minutesOffset * 60_000).toISOString();
}

/** Build an ISO timestamp interpreted as Asia/Ho_Chi_Minh local wall time. */
export function utcAsLocal(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
): string {
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0)).toISOString();
}
