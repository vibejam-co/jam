
export type WidgetType = 'profile' | 'music' | 'map' | 'video' | 'weather' | 'notes';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: '1x1' | '2x1' | '1x2' | '2x2';
  color?: string;
}

export interface WidgetCardProps {
  widget: Widget;
  isActive: boolean;
  onActivate: (id: string | null) => void;
}
