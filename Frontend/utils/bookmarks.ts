"use client";

export function getBookmarks(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("bookmarks");
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function isBookmarked(id: number): boolean {
  const list = getBookmarks();
  return list.includes(id);
}

export function toggleBookmark(id: number): boolean {
  if (typeof window === "undefined") return false;
  const current = getBookmarks();
  const exists = current.includes(id);
  const next = exists ? current.filter((x) => x !== id) : [...current, id];
  try {
    window.localStorage.setItem("bookmarks", JSON.stringify(next));
  } catch {}
  return !exists;
}
