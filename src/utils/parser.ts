export function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

export function parseUploadedDate(text: string): string {
  // Parsing tanggal unggah jika ada pola tertentu, misalnya "Posted on July 3, 2026"
  const cleaned = cleanText(text);
  const match = cleaned.match(/Posted (?:by .+? )?on (.+)/i) || cleaned.match(/(\d+\s+\w+\s+\d{4})/);
  return match ? match[1] : cleaned;
}
