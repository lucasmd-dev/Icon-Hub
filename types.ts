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

export interface IconifyCollectionCatalogEntry {
  name?: string;
  total?: number;
}

export interface IconifyCollectionResponse {
  title?: string;
  name?: string;
  total?: number;
  uncategorized?: string[];
  categories?: Record<string, string[]>;
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

export interface CollectionOverview {
  prefix: string;
  name: string;
  total: number;
}
