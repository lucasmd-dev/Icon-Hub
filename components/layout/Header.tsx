import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  totalIcons: number;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery, totalIcons }) => {
  const [inputValue, setInputValue] = useState<string>(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setSearchQuery(inputValue);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const showClearButton = inputValue.length > 0;

  return (
    <header className="h-20 border-b border-slate-800 bg-dark/80 backdrop-blur-md flex items-center px-6 sticky top-0 z-10">
      <div className="flex-1 flex items-center max-w-2xl relative group">
        <Search className="absolute left-4 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search icons (e.g., 'home', 'money', 'user')..."
          className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 pl-12 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 ease-in-out placeholder:text-slate-500"
          style={{ paddingRight: showClearButton ? '10rem' : '12rem' }}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-4 hidden sm:flex items-center gap-1.5">
          <kbd className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-xs border border-slate-700 font-mono">⌘ K</kbd>
          <span className="text-slate-500 text-xs">to focus</span>
          <span className="text-slate-500 text-xs">•</span>
          <kbd className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-xs border border-slate-700 font-mono">↵</kbd>
          <span className="text-slate-500 text-xs">to search</span>
          {showClearButton && (
            <>
              <span className="text-slate-500 text-xs">•</span>
              <button
                onClick={handleClear}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Icons</span>
          <span className="text-sm font-bold text-slate-200">
            {totalIcons > 0 ? totalIcons.toLocaleString() : '--'}
          </span>
        </div>
      </div>
    </header>
  );
};