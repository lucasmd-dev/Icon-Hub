import React, { useRef, useCallback, useEffect } from 'react';
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { IconData } from '../../types';
import { Loader2, AlertCircle } from 'lucide-react';
import { API_BASE, isColoredIcon } from '../../constants';
import { useScrollPosition } from '../../hooks/useScrollPosition';

interface IconGridProps {
  icons: IconData[];
  loading: boolean;
  loadingMore?: boolean;
  error: string | null;
  hasMore?: boolean;
  isAllCollectionsMode?: boolean;
  total?: number;
  scrollKey?: string;
  onLoadMore?: () => void;
  onIconClick: (icon: IconData) => void;
}

export const IconGrid: React.FC<IconGridProps> = ({ 
  icons, 
  loading, 
  loadingMore = false,
  error, 
  hasMore = false,
  isAllCollectionsMode = false,
  total = 0,
  scrollKey = 'default',
  onLoadMore,
  onIconClick 
}) => {
  const GUTTER_SIZE = 16;
  const COLUMN_WIDTH = 100;
  const ROW_HEIGHT = 100;
  const gridRef = useRef<FixedSizeGrid>(null);
  const loadingMoreRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const previousScrollKeyRef = useRef(scrollKey);
  const { saveScrollPosition, restoreScrollPosition } = useScrollPosition(scrollKey);
  
  useEffect(() => {
    return () => {
      if (gridRef.current && lastScrollTopRef.current > 0) {
        saveScrollPosition(lastScrollTopRef.current, 0);
      }
    };
  }, [scrollKey, saveScrollPosition]);
  
  useEffect(() => {
    if (previousScrollKeyRef.current !== scrollKey) {
      previousScrollKeyRef.current = scrollKey;
      lastScrollTopRef.current = 0;
    }
    
    if (!loading && icons.length > 0 && gridRef.current) {
      setTimeout(() => {
        restoreScrollPosition(gridRef);
      }, 200);
    }
  }, [loading, icons.length, scrollKey, restoreScrollPosition]);

  if (loading && icons.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
        <p>Searching universe...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-red-400">
        <AlertCircle className="w-10 h-10 mb-4" />
        <p>{error}</p>
      </div>
    );
  }

  if (!loading && icons.length === 0 && !isAllCollectionsMode && total === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 px-8">
        <div className="mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 32 32" className="text-white fill-white opacity-80">
            <path fill="currentColor" d="M30.48 4.575H32v1.52h-1.52Zm0 10.66h-3.05v1.53h1.52v4.57H25.9v-1.52h-1.52v3.04h4.57v4.58h1.53v-4.58H32v-1.52h-1.52zm0-6.09h-1.53v1.52h-1.52v1.53h1.52v1.52h1.53v-1.52H32v-1.53h-1.52z"/>
            <path fill="currentColor" d="M25.9 16.765h1.53v3.05H25.9Zm-1.52-10.67h1.52v1.53h-1.52Zm-1.52 6.1h1.52v3.04h-1.52Zm-10.67 13.71v-7.62h-1.52v4.57H9.14v1.53H7.62v3.05h1.52v1.52h13.72v-1.52h1.52v-3.05h-1.52v-1.53h-1.53v-4.57h-1.52v7.62zm9.14-10.67h1.53v1.53h-1.53Zm0-4.57h1.53v1.53h-1.53Zm-1.52-7.62h1.52v1.53h-1.52Zm-1.52 13.72h1.52v1.52h-1.52Zm0-6.1h1.52v1.53h-1.52Z"/>
            <path fill="currentColor" d="M16.76 19.815h1.53v1.52h-1.53Zm-3.05 3.04h4.58v1.53h-4.58Zm0-7.62h4.58v1.53h-4.58Zm0 4.58h1.53v1.52h-1.53Zm0-12.19v1.52h-1.52v1.52h1.52v1.53h1.53v-1.53h1.52v-1.52h-1.52v-1.52zm-1.52 9.14h1.52v1.52h-1.52Zm-3.05-4.57h3.05v1.52H9.14Zm0 3.04h1.53v1.53H9.14Zm0-12.19h1.53v1.53H9.14Zm-1.52 10.67h1.52v1.52H7.62Zm-4.57 1.52v1.53h1.52v4.57H1.52v-1.52H0v3.04h4.57v3.05H6.1v-3.05h1.52v-1.52H6.1v-6.1zm3.05-6.09h1.52v1.52H6.1Z"/>
            <path fill="currentColor" d="M1.52 16.765h1.53v3.05H1.52Zm0-12.19v1.52H0v1.53h1.52v1.52h1.53v-1.52h1.52v-1.53H3.05v-1.52z"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-200 mb-3">No icons found</h2>
        <p className="text-lg text-slate-400 text-center max-w-md">
          Try searching in English for better results
        </p>
      </div>
    );
  }

  const Cell = ({ columnIndex, rowIndex, style, data }: any) => {
    const { icons, columnCount, onIconClick } = data;
    const index = rowIndex * columnCount + columnIndex;
    const icon = icons[index];

    if (!icon) return null;

    const colored = isColoredIcon(icon.prefix);
    const iconUrl = colored
      ? `${API_BASE}/${icon.prefix}/${icon.name}.svg`
      : `${API_BASE}/${icon.prefix}/${icon.name}.svg?color=white`;

    return (
      <div style={{
        ...style,
        left: (style.left as number) + GUTTER_SIZE,
        top: (style.top as number) + GUTTER_SIZE,
        width: (style.width as number) - GUTTER_SIZE,
        height: (style.height as number) - GUTTER_SIZE
      }}>
        <button
          onClick={() => onIconClick(icon)}
          className="w-full h-full flex flex-col items-center justify-center bg-card hover:bg-slate-700 border border-slate-800 hover:border-primary/50 rounded-xl transition-all group relative overflow-hidden"
          title={icon.name}
          aria-label={icon.name}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 to-primary/0 group-hover:to-primary/5 transition-all" />
          <img 
            src={iconUrl} 
            alt=""
            className={`w-12 h-12 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 ${!colored ? 'brightness-0 invert' : ''}`}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      {total > 0 && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">
                Showing <span className="font-semibold text-slate-200">{icons.length.toLocaleString()}</span> of <span className="font-semibold text-slate-200">{total.toLocaleString()}</span> icons
              </span>
              {(loading || loadingMore) && (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              )}
            </div>
            {!hasMore && icons.length > 0 && (
              <span className="text-xs text-slate-500">All icons loaded</span>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1 px-4 pb-4 relative">
        <AutoSizer>
        {({ height, width }: { height: number; width: number }) => {
          const effectiveWidth = width - 32;
          const columnCount = Math.floor(effectiveWidth / COLUMN_WIDTH);
          const rowCount = Math.ceil(icons.length / columnCount);
          const cellWidth = effectiveWidth / columnCount;

          const handleScroll = ({ scrollTop, scrollLeft, scrollUpdateWasRequested }: any) => {
            const prevScrollTop = lastScrollTopRef.current;
            lastScrollTopRef.current = scrollTop;
            
            if (!scrollUpdateWasRequested) {
              saveScrollPosition(scrollTop, scrollLeft);
            }
            
            if (scrollUpdateWasRequested || !hasMore || loadingMore || !onLoadMore) return;
            if (loadingMoreRef.current) return;
            if (scrollTop <= prevScrollTop) return;

            const totalRows = Math.ceil(icons.length / columnCount);
            const totalHeight = totalRows * ROW_HEIGHT;
            const scrollBottom = scrollTop + height;
            const threshold = totalHeight - (ROW_HEIGHT * 3);

            if (scrollBottom >= threshold && scrollTop > 0) {
              loadingMoreRef.current = true;
              onLoadMore();
              setTimeout(() => {
                loadingMoreRef.current = false;
              }, 1000);
            }
          };

          return (
            <>
              <FixedSizeGrid
                ref={gridRef}
                columnCount={columnCount}
                columnWidth={cellWidth}
                height={height}
                rowCount={rowCount}
                rowHeight={ROW_HEIGHT}
                width={width}
                itemData={{ icons, columnCount, onIconClick }}
                className="scrollbar-hide"
                onScroll={handleScroll}
              >
                {Cell}
              </FixedSizeGrid>
              {loadingMore && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-card px-4 py-2 rounded-lg border border-slate-700 shadow-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-slate-400">Loading more icons...</span>
                </div>
              )}
            </>
          );
        }}
      </AutoSizer>
      </div>
    </div>
  );
};