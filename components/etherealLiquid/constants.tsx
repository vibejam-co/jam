
import { LinkItem, MusicItem, UserProfile } from './types';

export const USER_DATA: UserProfile = {
  name: "Elara Vance",
  handle: "@elara.vibe",
  bio: "Creative Director & Sound Architect. Exploring the intersection of liquid interfaces and organic soundscapes.",
  avatar: "https://picsum.photos/seed/elara/400/400",
  followers: "12.4k",
  following: "842"
};

export const LINKS_DATA: LinkItem[] = [
  {
    id: '1',
    title: "Portfolio 2026",
    url: "#",
    icon: "Briefcase",
    description: "Latest works in immersive UI",
    size: 'large'
  },
  {
    id: '2',
    title: "Instagram",
    url: "#",
    icon: "Instagram",
    size: 'small'
  },
  {
    id: '3',
    title: "Twitter",
    url: "#",
    icon: "Twitter",
    size: 'small'
  },
  {
    id: '4',
    title: "The Lab Blog",
    url: "#",
    icon: "BookOpen",
    description: "Weekly thoughts on design",
    size: 'medium'
  },
  {
    id: '5',
    title: "Newsletter",
    url: "#",
    icon: "Mail",
    size: 'medium'
  }
];

export const MUSIC_DATA: MusicItem[] = [
  { id: 'm1', title: "Ethereal Bloom", artist: "Vance", cover: "https://picsum.photos/seed/music1/300/300", plays: "1.2M" },
  { id: 'm2', title: "Crystal Skies", artist: "Lia", cover: "https://picsum.photos/seed/music2/300/300", plays: "840K" },
  { id: 'm3', title: "Liquid Echo", artist: "Flux", cover: "https://picsum.photos/seed/music3/300/300", plays: "2.1M" }
];
