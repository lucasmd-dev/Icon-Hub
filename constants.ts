import { IconSetOption } from './types';

export const API_BASE = 'https://api.iconify.design';

export const COLORED_ICON_PREFIXES = [
  'noto', 'noto-emoji', 'fx', 'fx-emoji', 'flag', 'flag-pack',
  'twemoji', 'emojione', 'fluent-emoji', 'fluent-emoji-flat', 'openmoji'
];

export const isColoredIcon = (prefix: string): boolean =>
  COLORED_ICON_PREFIXES.includes(prefix) ||
  prefix.includes('emoji') ||
  prefix.includes('flag');

export const POPULAR_COLLECTIONS: IconSetOption[] = [
  { id: 'mdi', name: 'Material Design', count: '7000+' },
  { id: 'ph', name: 'Phosphor', count: '1200+' },
  { id: 'fa6-solid', name: 'FontAwesome Solid', count: '2000+' },
  { id: 'lucide', name: 'Lucide', count: '1400+' },
  { id: 'heroicons', name: 'Heroicons', count: '280+' },
  { id: 'carbon', name: 'Carbon', count: '1800+' },
  { id: 'tabler', name: 'Tabler', count: '3000+' },
  { id: 'solar', name: 'Solar', count: '1000+' },
];
