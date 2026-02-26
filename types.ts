export interface IconifySearchResult {
  icons: string[];
  total: number;
  limit: number;
  start: number;
  collections: Record<string, IconifyCollectionInfo>;
}

export interface IconifyCollectionInfo {
  name: string;
  total: number;
  author?: {
    name: string;
    url?: string;
  };
  license?: {
    title: string;
    url?: string;
  };
}

export interface IconData {
  prefix: string;
  name: string;
  fullName: string;
}

export interface IconSetOption {
  id: string;
  name: string;
  count?: string;
}

export type SnippetType = 'svg' | 'jsx' | 'vue' | 'svelte' | 'url';