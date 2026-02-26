import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { IconGrid } from './components/icon/IconGrid';
import { IconDetailModal } from './components/icon/IconDetailModal';
import { useIconSearch } from './hooks/useIconSearch';
import { IconData } from './types';

const App: React.FC = () => {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<IconData | null>(null);

  const { icons, loading, loadingMore, error, total, hasMore, loadMore } = useIconSearch(searchQuery, selectedCollection);
  const isAllCollectionsMode = selectedCollection === null && (!searchQuery || searchQuery.trim().length === 0);

  return (
    <div className="flex h-full w-full bg-dark text-slate-200">
      <Sidebar 
        selectedCollection={selectedCollection} 
        onSelectCollection={setSelectedCollection} 
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          totalIcons={total}
        />

        <main className="flex-1 relative overflow-hidden bg-dark flex flex-col">
          <IconGrid 
            icons={icons} 
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            hasMore={hasMore}
            isAllCollectionsMode={isAllCollectionsMode}
            total={total}
            scrollKey={selectedCollection || 'all-collections'}
            onLoadMore={loadMore}
            onIconClick={setSelectedIcon} 
          />
        </main>
      </div>

      {selectedIcon && (
        <IconDetailModal 
          icon={selectedIcon} 
          onClose={() => setSelectedIcon(null)} 
        />
      )}
    </div>
  );
};

export default App;