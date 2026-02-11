
export type WidgetType = 'tiktok' | 'newsletter' | 'polaroid' | 'sticker' | 'note' | 'spotify';

export interface WidgetData {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  rotation: number;
  content?: any;
}

export interface CanvasState {
  x: number;
  y: number;
}
