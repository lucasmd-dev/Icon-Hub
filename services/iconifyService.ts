import { API_BASE, POPULAR_COLLECTIONS } from '../constants';
import { IconifySearchResult, IconifyCollectionInfo } from '../types';
import { translateToEnglish } from './translationService';

export const getAllAvailableCollections = async (): Promise<Array<{ prefix: string; name: string; total: number }>> => {
    try {
        const response = await fetch(`${API_BASE}/collections`);
        if (!response.ok) {
            throw new Error(`Collections API Error: ${response.statusText}`);
        }
        const data = await response.json();
        
        const collections: Array<{ prefix: string; name: string; total: number }> = [];
        for (const [prefix, info] of Object.entries(data)) {
            const collectionInfo = info as any;
            collections.push({
                prefix,
                name: collectionInfo.name || prefix,
                total: collectionInfo.total || 0
            });
        }
        
        return collections.sort((a, b) => b.total - a.total);
    } catch (error) {
        console.error("Failed to fetch all collections", error);
        return POPULAR_COLLECTIONS.map(col => ({
            prefix: col.id,
            name: col.name,
            total: 0
        }));
    }
};

const translateQuery = async (query: string): Promise<string> => {
  if (!query || query.trim() === '') {
    return '';
  }
  const translated = await translateToEnglish(query);
  const originalLower = query.toLowerCase().trim();
  return translated && translated !== originalLower ? translated : originalLower;
};

export const getCollectionInfo = async (prefix: string): Promise<{ total: number; name: string }> => {
    try {
        const response = await fetch(`${API_BASE}/collection?prefix=${prefix}`);
        if (!response.ok) {
            throw new Error(`Collection API Error: ${response.statusText}`);
        }
        const data = await response.json();
        return {
            total: data.total || 0,
            name: data.title || prefix
        };
    } catch (error) {
        console.error("Failed to fetch collection info", error);
        throw error;
    }
};

const getCollectionIcons = async (prefix: string, limit?: number, start: number = 0): Promise<IconifySearchResult> => {
    try {
        const response = await fetch(`${API_BASE}/collection?prefix=${prefix}`);
        if (!response.ok) {
            throw new Error(`Collection API Error: ${response.statusText}`);
        }
        const data = await response.json();
        
        let allIcons: string[] = [];
        if (data.uncategorized) {
            allIcons = [...allIcons, ...data.uncategorized];
        }
        if (data.categories) {
            Object.values(data.categories).forEach((catIcons: any) => {
                if (Array.isArray(catIcons)) {
                    allIcons = [...allIcons, ...catIcons];
                }
            });
        }

        const totalCount = data.total || allIcons.length;
        const iconsToReturn = limit 
            ? allIcons.slice(start, Math.min(start + limit, totalCount))
            : allIcons;

        const formattedIcons = iconsToReturn.map(name => `${prefix}:${name}`);

        return {
            icons: formattedIcons,
            total: totalCount,
            limit: limit || totalCount,
            start: limit ? start : 0,
            collections: { [prefix]: { name: data.title, total: totalCount } }
        };
    } catch (error) {
        console.error("Failed to fetch collection details", error);
        throw error;
    }
};

const getAllCollectionsIcons = async (limit: number = 1000, start: number = 0): Promise<IconifySearchResult> => {
    try {
        const allCollections = await getAllAvailableCollections();
        const collectionInfos = await Promise.all(
            allCollections.map(async (col) => {
                try {
                    if (col.total > 0) {
                        return { prefix: col.prefix, total: col.total, name: col.name };
                    }
                    const info = await getCollectionInfo(col.prefix);
                    return { prefix: col.prefix, total: info.total, name: info.name };
                } catch (error) {
                    console.error(`Failed to fetch info for ${col.prefix}:`, error);
                    return { prefix: col.prefix, total: col.total || 0, name: col.name };
                }
            })
        );

        const totalIcons = collectionInfos.reduce((sum, info) => sum + info.total, 0);
        const collectionsMap: Record<string, IconifyCollectionInfo> = {};
        collectionInfos.forEach(info => {
            collectionsMap[info.prefix] = { name: info.name, total: info.total };
        });

        const iconsPerBatch = 20;
        const allIcons: string[] = [];
        let fetchedCount = 0;
        const collectionOffsets = new Map<string, number>();

        let remainingStart = start;
        let collectionIndex = 0;
        while (remainingStart > 0 && collectionIndex < collectionInfos.length * 100) {
            const info = collectionInfos[collectionIndex % collectionInfos.length];
            if (info.total === 0) {
                collectionIndex++;
                continue;
            }
            
            const currentOffset = collectionOffsets.get(info.prefix) || 0;
            if (currentOffset < info.total) {
                const skipCount = Math.min(remainingStart, 1);
                collectionOffsets.set(info.prefix, currentOffset + skipCount);
                remainingStart -= skipCount;
            }
            collectionIndex++;
        }

        let roundIndex = 0;
        while (fetchedCount < limit) {
            let fetchedInThisRound = false;
            
            for (const info of collectionInfos) {
                if (fetchedCount >= limit || info.total === 0) break;
                
                const currentOffset = collectionOffsets.get(info.prefix) || 0;
                if (currentOffset >= info.total) continue;
                
                const batchLimit = Math.min(iconsPerBatch, limit - fetchedCount, info.total - currentOffset);
                if (batchLimit <= 0) continue;
                
                try {
                    const result = await getCollectionIcons(info.prefix, batchLimit, currentOffset);
                    allIcons.push(...result.icons);
                    fetchedCount += result.icons.length;
                    collectionOffsets.set(info.prefix, currentOffset + result.icons.length);
                    fetchedInThisRound = true;
                } catch (error) {
                    console.error(`Failed to fetch icons from ${info.prefix}:`, error);
                    collectionOffsets.set(info.prefix, info.total);
                }
            }
            
            if (!fetchedInThisRound) break;
            roundIndex++;
            if (roundIndex > 1000) break;
        }

        return {
            icons: allIcons,
            total: totalIcons,
            limit: allIcons.length,
            start: start,
            collections: collectionsMap
        };
    } catch (error) {
        console.error("Failed to fetch all collections icons", error);
        throw error;
    }
};

export const searchIcons = async (
  query: string,
  collection: string | null = null,
  limit?: number,
  start: number = 0
): Promise<IconifySearchResult> => {
  const trimmedQuery = query ? query.trim() : '';
  
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
  
  if (collection) {
    params.append('prefix', collection);
  }

  try {
    const response = await fetch(`${API_BASE}/search?${params.toString()}`);
    if (!response.ok) {
      console.error("API Response not ok:", response.status, response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const data: IconifySearchResult = await response.json();
    return data;
  } catch (error) {
    console.error("Icon search failed", error);
    throw error;
  }
};

export const fetchIconSvg = async (prefix: string, name: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/${prefix}/${name}.svg`);
    if (!response.ok) throw new Error("Failed to fetch SVG");
    return await response.text();
  } catch (e) {
    console.error(e);
    return "";
  }
};