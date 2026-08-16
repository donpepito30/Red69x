export type Gender = 'female' | 'male' | 'couple' | 'trans';

export type ModelStatus = 'online' | 'private' | 'group' | 'away' | 'offline';

export interface TipOption {
  id: string;
  label: string;
  tokens: number;
  description: string;
  actionType: 'dance' | 'strip' | 'flash' | 'lovense' | 'custom';
}

export interface Model {
  id: string;
  username: string;
  displayName: string;
  age: number;
  country: string;
  countryCode: string;
  gender: Gender;
  status: ModelStatus;
  avatarUrl: string;
  snapshotUrl: string;
  videoUrl: string;
  streamUrls?: {
    original?: string;
    '480p'?: string;
    '240p'?: string;
  };
  iframeEmbedUrl?: string;
  viewersCount: number;
  rating: number;
  favoriteCount: number;
  rank: number;
  topic: string;
  goalTitle?: string;
  goalCurrent?: number;
  goalTarget?: number;
  tags: string[];
  languages: string[];
  ethnicity: string;
  bodyType: string;
  hairColor: string;
  tokensPerMin: number;
  isHd: boolean;
  isVr: boolean;
  isLovense: boolean;
  bio: string;
  schedule: string;
  galleryImages: string[];
  tipMenu: TipOption[];
  chatUrl?: string;
  affiliateUrl?: string;
  embedUrl?: string;
  avatar?: string;
  thumbnail?: string;
  name?: string;
  isLive?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  message: string;
  timestamp: string;
  isTip?: boolean;
  tipAmount?: number;
  isModel?: boolean;
  badge?: 'VIP' | 'MOD' | 'FAN' | 'TOP_TIPPER';
}

export interface FilterState {
  gender: Gender | 'all';
  tags: string[];
  search: string;
  minAge: number;
  maxAge: number;
  status: ModelStatus | 'all';
  sortBy: 'viewers' | 'rank' | 'tokens' | 'age' | 'rating';
  isLovenseOnly: boolean;
  isHdOnly: boolean;
  language: string;
  ethnicity: string;
  hairColor: string;
  bodyType: string;
}

export interface StripcashApiResponse {
  status: 'success';
  code: number;
  total_models: number;
  page: number;
  per_page: number;
  timestamp: string;
  models: Array<{
    id: string;
    username: string;
    display_name: string;
    gender: string;
    status: string;
    age: number;
    country: string;
    languages: string[];
    tags: string[];
    viewers_count: number;
    rating: number;
    tokens_per_min: number;
    topic: string;
    is_hd: boolean;
    is_vr: boolean;
    is_lovense: boolean;
    snapshot_url: string;
    avatar_url: string;
    iframe_embed_url: string;
    chat_url: string;
    affiliate_url: string;
  }>;
}
