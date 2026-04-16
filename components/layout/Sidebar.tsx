import { useEffect, useMemo, useState } from 'react';
import { Grid, Info, Layers, Search, X } from 'lucide-react';
import { getAllAvailableCollections } from '../../services/iconifyService';
import type { CollectionOverview } from '../../types';
import { cn } from '../../utils/cn';

interface SidebarProps {
  selectedCollection: string | null;
  onSelectCollection: (collectionId: string | null) => void;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ selectedCollection, onSelectCollection, open, onClose }: SidebarProps) {
  const [allCollections, setAllCollections] = useState<CollectionOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isActive = true;

    const fetchCollections = async () => {
      setLoading(true);

      try {
        const collections = await getAllAvailableCollections();
        if (isActive) {
          setAllCollections(collections);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void fetchCollections();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const filteredCollections = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return allCollections;
    }

    return allCollections.filter((collection) =>
      collection.name.toLowerCase().includes(normalizedQuery) ||
      collection.prefix.toLowerCase().includes(normalizedQuery)
    );
  }, [allCollections, searchQuery]);

  const handleSelectCollection = (collectionId: string | null) => {
    onSelectCollection(collectionId);

    if (open) {
      onClose();
    }
  };

  const content = (
    <>
      <div className="flex h-20 items-center border-b border-slate-800 px-5">
        <div className="flex flex-1 items-center gap-3 text-primary">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-lg font-bold tracking-tight text-white">IconHub</span>
            <span className="block text-xs text-slate-500">Busca de icones open source</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="group/info relative">
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
              aria-label="Dicas de busca"
            >
              <Info className="h-4 w-4" />
            </button>

            <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 invisible w-64 rounded-lg border border-slate-700 bg-slate-800 p-3 opacity-0 shadow-xl transition-all duration-200 group-hover/info:visible group-hover/info:opacity-100">
              <p className="text-sm leading-relaxed text-slate-200">
                A busca aceita termos em portugues. Quando necessario, a consulta e traduzida automaticamente para ampliar os resultados.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Fechar colecoes"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Explorar</h3>
            <button
              type="button"
              onClick={() => handleSelectCollection(null)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                selectedCollection === null
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              )}
            >
              <Grid className="h-4 w-4" />
              Todas as colecoes
            </button>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between px-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Colecoes</h3>
              <span className="text-xs text-slate-600">{filteredCollections.length}</span>
            </div>

            <div className="mb-3 px-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filtrar colecoes"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-1.5 pl-7 pr-2 text-xs text-slate-300 placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-primary" />
              </div>
            ) : filteredCollections.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/30 px-3 py-4 text-sm text-slate-400">
                Nenhuma colecao encontrada com esse filtro.
              </div>
            ) : (
              <div className="custom-scrollbar max-h-[calc(100vh-300px)] space-y-1 overflow-y-auto">
                {filteredCollections.map((collection) => (
                  <button
                    key={collection.prefix}
                    type="button"
                    onClick={() => handleSelectCollection(collection.prefix)}
                    className={cn(
                      'group flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                      selectedCollection === collection.prefix
                        ? 'border-primary/20 bg-primary/10 text-primary'
                        : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    )}
                  >
                    <span className="truncate">{collection.name}</span>
                    <span
                      className={cn(
                        'ml-2 flex h-6 min-w-[2rem] flex-shrink-0 items-center justify-center rounded-full px-2 py-1 text-xs font-medium',
                        selectedCollection === collection.prefix
                          ? 'bg-primary/20 text-primary'
                          : 'bg-slate-800 text-slate-600 group-hover:text-slate-500'
                      )}
                    >
                      {collection.total > 0 ? collection.total.toLocaleString('pt-BR') : '0'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden w-72 flex-col border-r border-slate-800 bg-card md:flex">
        {content}
      </aside>

      <div
        className={cn(
          'fixed inset-0 z-40 md:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity',
            open ? 'opacity-100' : 'opacity-0'
          )}
          aria-label="Fechar menu lateral"
        />

        <aside
          className={cn(
            'relative z-10 flex h-full w-[min(85vw,20rem)] flex-col border-r border-slate-800 bg-card shadow-panel transition-transform duration-300',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {content}
        </aside>
      </div>
    </>
  );
}
