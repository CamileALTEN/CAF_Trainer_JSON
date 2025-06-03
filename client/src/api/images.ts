export async function uploadImage(data: string): Promise<string> {
  const res = await fetch('/api/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  const json = await res.json();
  if (!res.ok || !json.url) throw new Error(json.error || 'Upload failed');
  return json.url as string;
}
