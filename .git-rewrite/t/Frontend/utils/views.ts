"use client";

const KEY = "listingViews";

type ViewsMap = Record<number, number>;

function read(): ViewsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ViewsMap) : {};
  } catch {
    return {};
  }
}

function write(map: ViewsMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {}
}

export function incrementView(id: number): number {
  const map = read();
  const next = (map[id] ?? 0) + 1;
  map[id] = next;
  write(map);
  return next;
}

export function getViews(id: number): number {
  const map = read();
  return map[id] ?? 0;
}

export function getAllViews(): ViewsMap {
  return read();
}
