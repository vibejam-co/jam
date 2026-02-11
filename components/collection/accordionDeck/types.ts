
export type SliceType = 'profile' | 'shop' | 'audio';

export interface SliceData {
  id: string;
  type: SliceType;
  title: string;
  subtitle: string;
  imageUrl: string;
  accentColor: string;
}
