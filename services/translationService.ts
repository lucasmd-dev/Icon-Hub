const TRANSLATION_API = 'https://api.mymemory.translated.net/get';
const CACHE = new Map<string, string>();

export async function translateToEnglish(text: string): Promise<string> {
  if (!text || text.trim() === '') return '';

  const normalized = text.trim().toLowerCase();
  if (CACHE.has(normalized)) return CACHE.get(normalized)!;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `${TRANSLATION_API}?q=${encodeURIComponent(text)}&langpair=pt|en`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) throw new Error('Translation API error');

    const data = await res.json();
    const translated = data?.responseData?.translatedText?.trim();

    if (!translated) throw new Error('No translation');

    const result = translated.toLowerCase();
    CACHE.set(normalized, result);
    return result;
  } catch {
    CACHE.set(normalized, normalized);
    return normalized;
  }
}

export function clearTranslationCache(): void {
  CACHE.clear();
}

export function getTranslationCacheStats() {
  return {
    size: CACHE.size,
    entries: Array.from(CACHE.entries()).slice(0, 10)
  };
}

