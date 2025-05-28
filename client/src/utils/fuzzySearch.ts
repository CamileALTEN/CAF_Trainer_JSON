export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
    }
  }
  return dp[m][n];
}

export function fuzzyMatch(text: string, query: string): boolean {
  const a = text.toLowerCase();
  const b = query.toLowerCase().trim();
  if (!b) return false;
  if (a.includes(b)) return true;
  const dist = levenshtein(a, b);
  return dist <= b.length / 3;
}

export function fuzzySearch<T>(items: T[], query: string, getter: (item: T) => string): T[] {
  if (!query.trim()) return [];
  return items.filter(it => fuzzyMatch(getter(it), query));
}
