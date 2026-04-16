const TRANSLATION_API = 'https://api.mymemory.translated.net/get';
const translationCache = new Map<string, string>();

interface TranslationResponse {
  responseData?: {
    translatedText?: string;
  };
}

export async function translateToEnglish(text: string): Promise<string> {
  if (!text.trim()) {
    return '';
  }

  const normalizedText = text.trim().toLowerCase();
  const cachedValue = translationCache.get(normalizedText);

  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `${TRANSLATION_API}?q=${encodeURIComponent(text)}&langpair=pt|en`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error('Translation API error');
    }

    const data = (await response.json()) as TranslationResponse;
    const translatedText = data.responseData?.translatedText?.trim();

    if (!translatedText) {
      throw new Error('Empty translation response');
    }

    const result = translatedText.toLowerCase();
    translationCache.set(normalizedText, result);
    return result;
  } catch {
    translationCache.set(normalizedText, normalizedText);
    return normalizedText;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
