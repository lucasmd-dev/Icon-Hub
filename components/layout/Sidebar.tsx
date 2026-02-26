import React, { useState, useEffect, useMemo } from 'react';
import { Layers, Grid, Search } from 'lucide-react';
import { cn } from '../../utils/cn';
import { getAllAvailableCollections } from '../../services/iconifyService';

interface SidebarProps {
  selectedCollection: string | null;
  onSelectCollection: (id: string | null) => void;
}

interface Collection {
  prefix: string;
  name: string;
  total: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedCollection, onSelectCollection }) => {
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      try {
        const collections = await getAllAvailableCollections();
        setAllCollections(collections);
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) {
      return allCollections;
    }
    const query = searchQuery.toLowerCase();
    return allCollections.filter(col => 
      col.name.toLowerCase().includes(query) || 
      col.prefix.toLowerCase().includes(query)
    );
  }, [allCollections, searchQuery]);
  return (
    <aside className="w-64 border-r border-slate-800 bg-card flex-col hidden md:flex">
      <div className="h-20 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-primary flex-1">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">IconHub</span>
        </div>
        <div className="relative group/info flex-shrink-0">
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800"
            aria-label="Search tips"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              className="fill-current"
              style={{ 
                shapeRendering: 'geometricPrecision',
                imageRendering: 'crisp-edges',
                textRendering: 'geometricPrecision'
              }}
            >
              <path 
                d="M12 16.5q.214 0 .357-.144T12.5 16v-4.5q0-.213-.144-.356T11.999 11t-.356.144t-.143.356V16q0 .213.144.356t.357.144M12 9.577q.262 0 .439-.177t.176-.438t-.177-.439T12 8.346t-.438.177t-.177.439t.177.438t.438.177M12.003 21q-1.867 0-3.51-.708q-1.643-.709-2.859-1.924t-1.925-2.856T3 12.003t.709-3.51Q4.417 6.85 5.63 5.634t2.857-1.925T11.997 3t3.51.709q1.643.708 2.859 1.922t1.925 2.857t.709 3.509t-.708 3.51t-1.924 2.859t-2.856 1.925t-3.509.709M12 20q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
                stroke="none"
                strokeWidth="0"
              />
            </svg>
          </button>
          <div className="absolute left-0 top-full mt-2 w-52 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-50 pointer-events-none">
            <p className="text-sm text-slate-200 leading-relaxed">
              Search in English for better results.
            </p>
            <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 transform rotate-45"></div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Discover</h3>
          <button
            onClick={() => onSelectCollection(null)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              selectedCollection === null
                ? "bg-primary text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
          >
            <Grid className="w-4 h-4" />
            All Collections
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collections</h3>
            <span className="text-xs text-slate-600">{filteredCollections.length}</span>
          </div>
          
          <div className="mb-3 px-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 text-slate-300 text-xs pl-7 pr-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-slate-600 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
              {filteredCollections.map((col) => (
                <button
                  key={col.prefix}
                  onClick={() => onSelectCollection(col.prefix)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group",
                    selectedCollection === col.prefix
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent"
                  )}
                >
                  <span className="truncate">{col.name}</span>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full bg-slate-800 min-w-[2rem] h-6 flex items-center justify-center flex-shrink-0 ml-2 font-medium",
                    selectedCollection === col.prefix ? "bg-primary/20 text-primary" : "text-slate-600 group-hover:text-slate-500"
                  )}>
                    {col.total > 0 ? col.total.toLocaleString() : '0'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};