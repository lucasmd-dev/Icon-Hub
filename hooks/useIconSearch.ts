import { useState, useEffect, useCallback } from 'react';
import { searchIcons, getCollectionInfo, getAllAvailableCollections } from '../services/iconifyService';
import { IconData } from '../types';

const PAGE_SIZE = 1000;

export const useIconSearch = (query: string, collection: string | null) => {
  const [icons, setIcons] = useState<IconData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [currentStart, setCurrentStart] = useState<number>(0);

  const isAllCollectionsMode = collection === null && (!query || query.trim().length === 0);

  useEffect(() => {
    const trimmedQuery = query ? query.trim() : '';
    const shouldFetch = collection !== null || trimmedQuery.length >= 2 || isAllCollectionsMode;

    if (!shouldFetch) {
      setIcons([]);
      setTotal(0);
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
            setTotal(totalCount);
          } catch (err) {
            console.error('Failed to fetch collection info:', err);
          }
        } else if (isAllCollectionsMode) {
          try {
            const allCollections = await getAllAvailableCollections();
            totalCount = allCollections.reduce((sum, col) => sum + (col.total || 0), 0);
            setTotal(totalCount);
          } catch (err) {
            console.error('Failed to fetch all collections info:', err);
          }
        }
        
        const data = await searchIcons(trimmedQuery, collection, PAGE_SIZE, 0);
        
        const formattedIcons: IconData[] = data.icons.map((iconStr) => {
          const [prefix, name] = iconStr.split(':');
          return {
            fullName: iconStr,
            prefix,
            name,
          };
        });

        setIcons(formattedIcons);
        
        if (trimmedQuery.length > 0 || collection) {
          setTotal(data.total);
        } else {
          setTotal(totalCount || data.total);
        }
        
        const finalTotal = totalCount || data.total;
        setHasMore(formattedIcons.length < finalTotal);
        setCurrentStart(formattedIcons.length);
      } catch (err) {
        setError('Failed to fetch icons. Please try again.');
        setIcons([]);
        setTotal(0);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query, collection, isAllCollectionsMode]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const trimmedQuery = query ? query.trim() : '';
      const remaining = total - currentStart;
      const limitToRequest = Math.min(PAGE_SIZE, remaining);
      
      if (limitToRequest <= 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      
      const data = await searchIcons(trimmedQuery, collection, limitToRequest, currentStart);
      
      const formattedIcons: IconData[] = data.icons.map((iconStr) => {
        const [prefix, name] = iconStr.split(':');
        return {
          fullName: iconStr,
          prefix,
          name,
        };
      });

      setIcons(prev => [...prev, ...formattedIcons]);
      const newStart = currentStart + formattedIcons.length;
      setCurrentStart(newStart);
      setHasMore(newStart < total);
    } catch (err) {
      console.error('Failed to load more icons:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, query, collection, currentStart, total]);

  return { icons, loading, loadingMore, error, total, hasMore, loadMore };
};