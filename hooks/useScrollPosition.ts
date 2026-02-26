import { useRef } from 'react';

const scrollPositions = new Map<string, { scrollTop: number; scrollLeft: number }>();
const isRestoringMap = new Map<string, boolean>();

export const useScrollPosition = (key: string) => {
  const saveScrollPosition = (scrollTop: number, scrollLeft: number = 0) => {
    const isRestoring = isRestoringMap.get(key) || false;
    if (!isRestoring) {
      scrollPositions.set(key, { scrollTop, scrollLeft });
    }
  };

  const restoreScrollPosition = (gridRef: React.RefObject<any>) => {
    const saved = scrollPositions.get(key);
    if (saved && gridRef.current) {
      isRestoringMap.set(key, true);
      gridRef.current.scrollTo({ scrollTop: saved.scrollTop, scrollLeft: saved.scrollLeft });
      setTimeout(() => {
        isRestoringMap.set(key, false);
      }, 200);
    } else if (gridRef.current) {
      isRestoringMap.set(key, true);
      gridRef.current.scrollTo({ scrollTop: 0, scrollLeft: 0 });
      setTimeout(() => {
        isRestoringMap.set(key, false);
      }, 200);
    }
  };

  return {
    saveScrollPosition,
    restoreScrollPosition,
  };
};

