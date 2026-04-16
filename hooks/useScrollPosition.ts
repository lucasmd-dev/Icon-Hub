import { useCallback, type RefObject } from 'react';

const scrollPositions = new Map<string, { scrollTop: number; scrollLeft: number }>();
const isRestoringMap = new Map<string, boolean>();

type ScrollableGrid = {
  scrollTo: (params: { scrollTop?: number; scrollLeft?: number }) => void;
};

export function useScrollPosition(key: string) {
  const saveScrollPosition = useCallback((scrollTop: number, scrollLeft = 0) => {
    const isRestoring = isRestoringMap.get(key) ?? false;

    if (!isRestoring) {
      scrollPositions.set(key, { scrollTop, scrollLeft });
    }
  }, [key]);

  const restoreScrollPosition = useCallback((gridRef: RefObject<ScrollableGrid | null>) => {
    const saved = scrollPositions.get(key);

    if (gridRef.current === null) {
      return;
    }

    isRestoringMap.set(key, true);

    if (saved) {
      gridRef.current.scrollTo({
        scrollTop: saved.scrollTop,
        scrollLeft: saved.scrollLeft,
      });
    } else {
      gridRef.current.scrollTo({ scrollTop: 0, scrollLeft: 0 });
    }

    window.setTimeout(() => {
      isRestoringMap.set(key, false);
    }, 200);
  }, [key]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
  };
}
