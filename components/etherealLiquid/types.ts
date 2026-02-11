
export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  description?: string;
  size: 'small' | 'medium' | 'large';
}

export interface MusicItem {
  id: string;
  title: string;
  artist: string;
  cover: string;
  plays: string;
}

export interface UserProfile {
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  followers: string;
  following: string;
}
