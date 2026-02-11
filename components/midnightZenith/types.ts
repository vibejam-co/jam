
export type CardType = 'vertical' | 'horizontal' | 'square';

export interface GridContent {
  id: string;
  type: CardType;
  title: string;
  subtitle: string;
  videoUrl: string;
  thumbnail?: string;
  accentColor: string;
}

export interface ProfileData {
  name: string;
  handle: string;
  bio: string;
  heroVideo: string;
  profilePic: string;
}
