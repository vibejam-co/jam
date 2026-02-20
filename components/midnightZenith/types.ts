
export type CardType = 'vertical' | 'horizontal' | 'square';

export interface GridContent {
  id: string;
  type: CardType;
  title: string;
  subtitle: string;
  category?: string;
  live?: boolean;
  videoUrl: string;
  thumbnail?: string;
  accentColor: string;
}

export interface ProfileData {
  name: string;
  handle: string;
  verified?: boolean;
  bio: string;
  heroVideo: string;
  profilePic: string;
}

export type MidnightZenithSectionKey = 'hero' | 'nav_tabs' | 'content_grid' | 'footer_cta';

export interface MidnightZenithSectionState {
  key: MidnightZenithSectionKey;
  label: string;
  visible: boolean;
  position: number;
}

export interface MidnightZenithNavTab {
  id: string;
  label: string;
}

export interface MidnightZenithFooterSocial {
  id: string;
  label: string;
  href: string;
}

export interface MidnightZenithRenderModel {
  hero: ProfileData;
  navTabs: MidnightZenithNavTab[];
  gridTiles: GridContent[];
  footer: {
    headline: string;
    subheadline: string;
    socials: MidnightZenithFooterSocial[];
    tagline: string;
  };
  sections: MidnightZenithSectionState[];
}
