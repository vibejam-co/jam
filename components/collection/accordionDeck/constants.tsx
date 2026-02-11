
import { SliceData } from './types';

export const SLICES: SliceData[] = [
  {
    id: '01',
    type: 'profile',
    title: 'THE CREATIVE',
    subtitle: 'ALEXANDER VANE',
    imageUrl: 'https://picsum.photos/seed/fashion1/1200/1800',
    accentColor: '#FFFFFF'
  },
  {
    id: '02',
    type: 'shop',
    title: 'COLLECTION 01',
    subtitle: 'SS25 LINE',
    imageUrl: 'https://picsum.photos/seed/fashion2/1200/1800',
    accentColor: '#FFFFFF'
  },
  {
    id: '03',
    type: 'audio',
    title: 'SOUNDSCAPE',
    subtitle: 'NOISE & ELEGANCE',
    imageUrl: 'https://picsum.photos/seed/fashion3/1200/1800',
    accentColor: '#FFFFFF'
  }
];

export const SPRING_TRANSITION = {
  type: "spring",
  stiffness: 120,
  damping: 20,
  mass: 1
};
