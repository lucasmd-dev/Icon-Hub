import { useCallback, useEffect, useState } from 'react';
import {
  getAllAvailableCollections,
  getCollectionInfo,
  searchIcons,
} from '../services/iconifyService';
import type { IconData } from '../types';

const PAGE_SIZE = 1000;

function mapIconData(iconName: string): IconData {
  const [prefix, name = ''] = iconName.split(':');

  return {
    fullName: iconName,
    prefix,
    name,
  };
}

export function useIconSearch(query: string, collection: string | null) {
  const [icons, setIcons] = useState<IconData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentStart, setCurrentStart] = useState(0);

  const trimmedQuery = query.trim();
  const isAllCollectionsMode = collection === null && trimmedQuery.length === 0;

  useEffect(() => {
    const shouldFetch = collection !== null || trimmedQuery.length >= 2 || isAllCollectionsMode;
    let isActive = true;

    if (!shouldFetch) {
      setIcons([]);
      setTotal(0);
      setError(null);
      setLoading(false);
      setHasMore(false);
      setCurrentStart(0);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setCurrentStart(0);
      
      try {
        let totalCount = 0;

        if (collection) {
          try {
            const info = await getCollectionInfo(collection);
            totalCount = info.total;
            if (isActive) {
              setTotal(totalCount);
            }
          } catch {
            totalCount = 0;
          }
        } else if (isAllCollectionsMode) {
          try {
            const allCollections = await getAllAvailableCollections();
            totalCount = allCollections.reduce((sum, currentCollection) => sum + currentCollection.total, 0);
            if (isActive) {
              setTotal(totalCount);
            }
          } catch {
            totalCount = 0;
          }
        }
        
        const data = await searchIcons(trimmedQuery, collection, PAGE_SIZE, 0);

        if (!isActive) {
          return;
        }

        const formattedIcons = data.icons.map(mapIconData);
        setIcons(formattedIcons);

        if (trimmedQuery.length > 0 || collection) {
          setTotal(data.total);
        } else {
          setTotal(totalCount || data.total);
        }

        const finalTotal = totalCount || data.total;
        setHasMore(formattedIcons.length < finalTotal);
        setCurrentStart(formattedIcons.length);
      } catch {
        if (!isActive) {
          return;
        }

        setError('Nao foi possivel carregar os icones agora. Tente novamente em instantes.');
        setIcons([]);
        setTotal(0);
        setHasMore(false);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isActive = false;
    };
  }, [collection, isAllCollectionsMode, trimmedQuery]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const remaining = total - currentStart;
      const limitToRequest = Math.min(PAGE_SIZE, remaining);
      
      if (limitToRequest <= 0) {
        setHasMore(false);
        return;
      }
      
      const data = await searchIcons(trimmedQuery, collection, limitToRequest, currentStart);
      const formattedIcons = data.icons.map(mapIconData);

      setIcons(prev => [...prev, ...formattedIcons]);
      const newStart = currentStart + formattedIcons.length;
      setCurrentStart(newStart);
      setHasMore(newStart < total);
    } catch {
      setError('Nao foi possivel carregar mais resultados agora.');
    } finally {
      setLoadingMore(false);
    }
  }, [collection, currentStart, hasMore, loadingMore, total, trimmedQuery]);

  return { icons, loading, loadingMore, error, total, hasMore, loadMore };
}
