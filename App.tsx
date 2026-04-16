import { useMemo, useState } from 'react';
import { IconDetailModal } from './components/icon/IconDetailModal';
import { IconGrid } from './components/icon/IconGrid';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { useIconSearch } from './hooks/useIconSearch';
import type { IconData } from './types';

function App() {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<IconData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { icons, loading, loadingMore, error, total, hasMore, loadMore } = useIconSearch(
    searchQuery,
    selectedCollection
  );
  const trimmedSearchQuery = searchQuery.trim();
  const isAllCollectionsMode = selectedCollection === null && trimmedSearchQuery.length === 0;
  const scrollKey = useMemo(
    () => `${selectedCollection ?? 'all'}:${trimmedSearchQuery.toLowerCase() || '__empty__'}`,
    [selectedCollection, trimmedSearchQuery]
  );

  const handleSelectCollection = (collectionId: string | null) => {
    setSelectedCollection(collectionId);
    setSelectedIcon(null);
  };

  return (
    <div className="flex h-full w-full bg-dark text-slate-200">
      <Sidebar
        selectedCollection={selectedCollection}
        onSelectCollection={handleSelectCollection}
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          totalIcons={total}
          selectedCollection={selectedCollection}
          onOpenCollections={() => setIsSidebarOpen(true)}
        />

        <main className="relative flex flex-1 flex-col overflow-hidden bg-dark">
          <IconGrid
            icons={icons}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            hasMore={hasMore}
            isAllCollectionsMode={isAllCollectionsMode}
            total={total}
            scrollKey={scrollKey}
            onLoadMore={loadMore}
            onIconClick={setSelectedIcon}
          />
        </main>
      </div>

      {selectedIcon && <IconDetailModal icon={selectedIcon} onClose={() => setSelectedIcon(null)} />}
    </div>
  );
}

export default App;
