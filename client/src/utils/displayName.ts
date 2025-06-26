export function displayName(username: string): string {
  const match = username.match(/^([^.]+)\.([^.@]+)/);
  if (match) {
    const first = match[1];
    const last = match[2];
    return `${first.charAt(0).toUpperCase()}${first.slice(1).toLowerCase()} ${last.toUpperCase()}`;
  }
  return username;
}
