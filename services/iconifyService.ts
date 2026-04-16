import { API_BASE, POPULAR_COLLECTIONS } from '../constants';
import type {
  CollectionOverview,
  IconifyCollectionCatalogEntry,
  IconifyCollectionInfo,
  IconifyCollectionResponse,
  IconifySearchResult,
} from '../types';
import { translateToEnglish } from './translationService';

const ICONS_PER_COLLECTION_BATCH = 20;
const MAX_ALL_COLLECTIONS_ROUNDS = 1000;

async function fetchJson<T>(url: string, fallbackMessage: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(fallbackMessage);
  }

  return (await response.json()) as T;
}

function normalizeCollectionName(
  prefix: string,
  collection: Pick<IconifyCollectionResponse, 'title' | 'name'>
): string {
  return collection.title ?? collection.name ?? prefix;
}

function getFallbackCollections(): CollectionOverview[] {
  return POPULAR_COLLECTIONS.map((collection) => ({
    prefix: collection.id,
    name: collection.name,
    total: 0,
  }));
}

export async function getAllAvailableCollections(): Promise<CollectionOverview[]> {
  try {
    const data = await fetchJson<Record<string, IconifyCollectionCatalogEntry>>(
      `${API_BASE}/collections`,
      'Nao foi possivel listar as colecoes.'
    );

    return Object.entries(data)
      .map(([prefix, collection]) => ({
        prefix,
        name: collection.name ?? prefix,
        total: collection.total ?? 0,
      }))
      .sort((firstCollection, secondCollection) => secondCollection.total - firstCollection.total);
  } catch {
    return getFallbackCollections();
  }
};

const translateQuery = async (query: string): Promise<string> => {
  if (!query.trim()) {
    return '';
  }

  const originalQuery = query.trim().toLowerCase();
  const translatedQuery = await translateToEnglish(query);

  return translatedQuery && translatedQuery !== originalQuery ? translatedQuery : originalQuery;
};

async function fetchCollection(prefix: string): Promise<IconifyCollectionResponse> {
  const params = new URLSearchParams({ prefix });

  return fetchJson<IconifyCollectionResponse>(
    `${API_BASE}/collection?${params.toString()}`,
    `Nao foi possivel carregar a colecao ${prefix}.`
  );
};

export async function getCollectionInfo(prefix: string): Promise<{ total: number; name: string }> {
  const collection = await fetchCollection(prefix);

  return {
    total: collection.total ?? 0,
    name: normalizeCollectionName(prefix, collection),
  };
};

async function getCollectionIcons(
  prefix: string,
  limit = 1000,
  start = 0
): Promise<IconifySearchResult> {
  const collection = await fetchCollection(prefix);
  const categorizedIcons = Object.values(collection.categories ?? {}).flat();
  const allIcons = [...(collection.uncategorized ?? []), ...categorizedIcons];
  const totalCount = collection.total ?? allIcons.length;
  const paginatedIcons = allIcons.slice(start, start + limit);

  return {
    icons: paginatedIcons.map((name) => `${prefix}:${name}`),
    total: totalCount,
    limit,
    start,
    collections: {
      [prefix]: {
        name: normalizeCollectionName(prefix, collection),
        total: totalCount,
      },
    },
  };
}

async function getAllCollectionsIcons(limit = 1000, start = 0): Promise<IconifySearchResult> {
  const allCollections = await getAllAvailableCollections();
  const collectionInfos = await Promise.all(
    allCollections.map(async (collection) => {
      if (collection.total > 0) {
        return collection;
      }

      try {
        const info = await getCollectionInfo(collection.prefix);
        return {
          prefix: collection.prefix,
          total: info.total,
          name: info.name,
        };
      } catch {
        return collection;
      }
    })
  );

  const totalIcons = collectionInfos.reduce((sum, collection) => sum + collection.total, 0);
  const collectionsMap: Record<string, IconifyCollectionInfo> = {};

  collectionInfos.forEach((collection) => {
    collectionsMap[collection.prefix] = {
      name: collection.name,
      total: collection.total,
    };
  });

  const collectionOffsets = new Map<string, number>();
  const allIcons: string[] = [];
  let fetchedCount = 0;
  let remainingStart = start;
  let collectionIndex = 0;

  while (remainingStart > 0 && collectionIndex < collectionInfos.length * 100) {
    const collection = collectionInfos[collectionIndex % collectionInfos.length];

    if (collection.total > 0) {
      const currentOffset = collectionOffsets.get(collection.prefix) ?? 0;
      if (currentOffset < collection.total) {
        collectionOffsets.set(collection.prefix, currentOffset + 1);
        remainingStart -= 1;
      }
    }
    collectionIndex += 1;
  }

  let roundIndex = 0;

  while (fetchedCount < limit && roundIndex < MAX_ALL_COLLECTIONS_ROUNDS) {
    let fetchedInCurrentRound = false;

    for (const collection of collectionInfos) {
      if (fetchedCount >= limit) {
        break;
      }

      if (collection.total === 0) {
        continue;
      }

      const currentOffset = collectionOffsets.get(collection.prefix) ?? 0;

      if (currentOffset >= collection.total) {
        continue;
      }

      const batchLimit = Math.min(
        ICONS_PER_COLLECTION_BATCH,
        limit - fetchedCount,
        collection.total - currentOffset
      );

      if (batchLimit <= 0) {
        continue;
      }

      try {
        const result = await getCollectionIcons(collection.prefix, batchLimit, currentOffset);
        allIcons.push(...result.icons);
        fetchedCount += result.icons.length;
        collectionOffsets.set(collection.prefix, currentOffset + result.icons.length);
        fetchedInCurrentRound = true;
      } catch {
        collectionOffsets.set(collection.prefix, collection.total);
      }
    }

    if (!fetchedInCurrentRound) {
      break;
    }

    roundIndex += 1;
  }

  return {
    icons: allIcons,
    total: totalIcons,
    limit: allIcons.length,
    start,
    collections: collectionsMap,
  };
}

export const searchIcons = async (
  query: string,
  collection: string | null = null,
  limit?: number,
  start: number = 0
): Promise<IconifySearchResult> => {
  const trimmedQuery = query.trim();
  
  if (trimmedQuery === '' && collection) {
    return getCollectionIcons(collection, limit || 1000, start);
  }
  
  if (trimmedQuery === '' && !collection) {
    return getAllCollectionsIcons(limit || 1000, start);
  }

  const searchLimit = limit || 500;
  const finalQuery = await translateQuery(trimmedQuery);
  const effectiveQuery = finalQuery || trimmedQuery;
  
  if (!effectiveQuery) {
    return {
      icons: [],
      total: 0,
      limit: 0,
      start: 0,
      collections: {}
    };
  }

  const params = new URLSearchParams();
  params.append('query', effectiveQuery);
  params.append('limit', searchLimit.toString());
  params.append('start', start.toString());
  
  if (collection) {
    params.append('prefix', collection);
  }

  return fetchJson<IconifySearchResult>(
    `${API_BASE}/search?${params.toString()}`,
    'Nao foi possivel buscar os icones.'
  );
};

export const fetchIconSvg = async (prefix: string, name: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/${prefix}/${name}.svg`);
    if (!response.ok) {
      throw new Error('SVG unavailable');
    }

    return await response.text();
  } catch {
    return '';
  }
};
