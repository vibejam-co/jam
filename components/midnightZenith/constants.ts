
import { GridContent, ProfileData } from './types';

export const CATEGORIES = ["All", "Films", "Series", "Music", "Experimental", "Archives"];

export const PROFILE_DATA: ProfileData = {
  name: "ALEXA VALENTINE",
  handle: "@alexavalentine",
  bio: "Visual Director & Digital Architect. Award-winning filmmaker specializing in high-contrast neon aesthetics and immersive digital environments. Currently based in Tokyo.",
  heroVideo: "https://player.vimeo.com/external/494451511.sd.mp4?s=d004652433290635f9926d83332462e0802c6591&profile_id=165&oauth2_token_id=57447761",
  profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400"
};

export const GRID_ITEMS: GridContent[] = [
  {
    id: '1',
    type: 'vertical',
    title: 'Neon Pulse',
    subtitle: 'Director Edit',
    videoUrl: 'https://player.vimeo.com/external/394142410.sd.mp4?s=996a635836c078f4b0559e30a588b528a41753c1&profile_id=165&oauth2_token_id=57447761',
    accentColor: '#ff00ff'
  },
  {
    id: '2',
    type: 'horizontal',
    title: 'Late Night Sessions',
    subtitle: 'EP. 04 - The Void',
    videoUrl: 'https://player.vimeo.com/external/494449033.sd.mp4?s=9d5543c7b282914c6f50b86a83679116e11f7e02&profile_id=165&oauth2_token_id=57447761',
    accentColor: '#00ffff'
  },
  {
    id: '3',
    type: 'square',
    title: 'Ethereal',
    subtitle: 'Music Release',
    videoUrl: 'https://player.vimeo.com/external/517090025.sd.mp4?s=6f2a6a161f302061247071f649e3d82f7c4613c7&profile_id=165&oauth2_token_id=57447761',
    accentColor: '#ffff00'
  },
  {
    id: '4',
    type: 'vertical',
    title: 'Urban Flow',
    subtitle: 'Street Series',
    videoUrl: 'https://player.vimeo.com/external/530182417.sd.mp4?s=f5e85c90b0649733075253e20e363b9f42777321&profile_id=165&oauth2_token_id=57447761',
    accentColor: '#ff4400'
  },
  {
    id: '5',
    type: 'horizontal',
    title: 'Abstract Minds',
    subtitle: 'Short Film',
    videoUrl: 'https://player.vimeo.com/external/517090334.sd.mp4?s=384c3757361b171f251648d888f980164627083a&profile_id=165&oauth2_token_id=57447761',
    accentColor: '#ffffff'
  },
  {
    id: '6',
    type: 'square',
    title: 'Studio Log',
    subtitle: 'Behind Scenes',
    videoUrl: 'https://player.vimeo.com/external/494449557.sd.mp4?s=1f13b199c08a901f92e5c83f3e0c036c7a036814&profile_id=165&oauth2_token_id=57447761',
    accentColor: '#44ff44'
  },
  {
    id: '7',
    type: 'vertical',
    title: 'Midnight Sun',
    subtitle: 'Travel Diary',
    videoUrl: 'https://player.vimeo.com/external/494449033.sd.mp4?s=9d5543c7b282914c6f50b86a83679116e11f7e02&profile_id=165&oauth2_token_id=57447761',
    accentColor: '#ffaa00'
  },
  {
    id: '8',
    type: 'horizontal',
    title: 'Glitch Horizon',
    subtitle: 'Digital Art',
    videoUrl: 'https://player.vimeo.com/external/394142410.sd.mp4?s=996a635836c078f4b0559e30a588b528a41753c1&profile_id=165&oauth2_token_id=57447761',
    accentColor: '#8800ff'
  }
];

export const MIDNIGHT_FOOTER = {
  headline: 'STAY IN THE LOOP',
  subheadline: 'New drops every Friday at Midnight',
  socials: [
    { id: 'footer-instagram', label: 'Instagram', href: 'https://instagram.com/vibejamco' },
    { id: 'footer-twitter', label: 'Twitter', href: 'https://x.com/vibejamco' },
    { id: 'footer-vimeo', label: 'Vimeo', href: 'https://vimeo.com' },
    { id: 'footer-discord', label: 'Discord', href: 'https://discord.gg/vibejam' },
  ],
  tagline: 'Designed for Immersion © 2025',
};
