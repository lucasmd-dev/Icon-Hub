import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Menu, Search, X } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalIcons: number;
  selectedCollection: string | null;
  onOpenCollections: () => void;
}

export function Header({
  searchQuery,
  setSearchQuery,
  totalIcons,
  selectedCollection,
  onOpenCollections,
}: HeaderProps) {
  const [inputValue, setInputValue] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleShortcut);

    return () => {
      window.removeEventListener('keydown', handleShortcut);
    };
  }, []);

  const applySearch = () => {
    setSearchQuery(inputValue);
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applySearch();
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const showClearButton = inputValue.length > 0;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-dark/85 backdrop-blur-md">
      <div className="flex h-20 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenCollections}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 transition-colors hover:border-slate-600 hover:text-white md:hidden"
          aria-label="Abrir colecoes"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="group relative flex-1 max-w-3xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Busque por nome ou contexto, como menu, financeiro ou usuario."
            className="w-full rounded-xl border border-slate-700 bg-slate-900/50 py-3 pl-12 pr-28 text-slate-100 outline-none transition-all duration-300 ease-in-out placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/40 sm:pr-40 xl:pr-60"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />

          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {showClearButton && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={applySearch}
              className="rounded-lg bg-primary/15 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/25 hover:text-white"
            >
              <span className="hidden sm:inline">Buscar</span>
              <Search className="h-4 w-4 sm:hidden" />
            </button>

            <div className="hidden xl:flex items-center gap-1.5">
              <kbd className="rounded border border-slate-700 bg-slate-800 px-2 py-1 font-mono text-xs text-slate-400">⌘ K</kbd>
              <span className="text-xs text-slate-500">foco</span>
              <span className="text-xs text-slate-500">•</span>
              <kbd className="rounded border border-slate-700 bg-slate-800 px-2 py-1 font-mono text-xs text-slate-400">↵</kbd>
              <span className="text-xs text-slate-500">buscar</span>
            </div>
          </div>
        </div>

        <div className="ml-auto hidden items-center gap-4 md:flex">
          {selectedCollection && (
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {selectedCollection}
            </span>
          )}

          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total de icones</span>
            <span className="text-sm font-bold text-slate-200">
              {totalIcons > 0 ? totalIcons.toLocaleString('pt-BR') : '--'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
