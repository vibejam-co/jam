
import React from 'react';
import { WidgetData } from './types';

export const CANVAS_SIZE = 4000;

export const INITIAL_WIDGETS: WidgetData[] = [
  {
    id: 'profile-1',
    type: 'polaroid',
    x: 1850,
    y: 1800,
    rotation: -2,
    content: {
      image: 'https://picsum.photos/seed/user1/400/400',
      title: 'Alex Vibe',
      subtitle: 'Spatial Designer'
    }
  },
  {
    id: 'video-1',
    type: 'tiktok',
    x: 2150,
    y: 1750,
    rotation: 3,
    content: {
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-33519-large.mp4'
    }
  },
  {
    id: 'newsletter-1',
    type: 'newsletter',
    x: 1750,
    y: 2100,
    rotation: 1,
    content: {
      title: 'Weekly Vibe Letter',
      description: 'The best spatial design tools delivered to your desk.'
    }
  },
  {
    id: 'note-1',
    type: 'note',
    x: 2200,
    y: 2150,
    rotation: -5,
    content: {
      text: "Don't forget to check the new Miro board!"
    }
  },
  {
    id: 'sticker-1',
    type: 'sticker',
    x: 2000,
    y: 2050,
    rotation: 15,
    content: {
      label: 'VibeJam 2025'
    }
  },
  {
    id: 'spotify-1',
    type: 'spotify',
    x: 1550,
    y: 1850,
    rotation: -3,
    content: {
      track: 'After Dark - Mr. Kitty'
    }
  },
  {
    id: 'arrow-1',
    type: 'sticker',
    x: 1650,
    y: 1950,
    rotation: -45,
    content: {
      type: 'arrow'
    }
  }
];
