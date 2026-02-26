import { SYNONYMS } from '../constants';

const translationCache = new Map<string, string>();

export async function translateToEnglish(text: string): Promise<string> {
  if (!text || text.trim() === '') {
    return '';
  }
  
  const normalized = text.trim().toLowerCase();
  
  if (translationCache.has(normalized)) {
    return translationCache.get(normalized)!;
  }
  
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  
  const translatedWords = words.map(word => {
    const cleanWord = word.replace(/[.,!?;:()\[\]{}'"]/g, '');
    
    if (SYNONYMS[cleanWord]) {
      return SYNONYMS[cleanWord];
    }
    
    const noAccent = cleanWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (SYNONYMS[noAccent]) {
      return SYNONYMS[noAccent];
    }
    
    return cleanWord;
  });
  
  const result = translatedWords.join(' ');
  
  translationCache.set(normalized, result);
  
  return result;
}

export function clearTranslationCache(): void {
  translationCache.clear();
}

export function getTranslationCacheStats() {
  return {
    size: translationCache.size,
    entries: Array.from(translationCache.entries()).slice(0, 10)
  };
}

