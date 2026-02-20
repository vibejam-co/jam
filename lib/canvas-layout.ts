import type {
  CanvasLayoutBlock,
  CanvasLayoutBlockType,
  CanvasLayoutSchema,
  CanvasMonetization,
} from '../types';

export const LAYOUT_SCHEMA_VERSION = 1;
export const MAX_LAYOUT_BLOCKS = 24;

const BLOCK_TITLES: Record<CanvasLayoutBlockType, string> = {
  hero: 'Hero',
  stats: 'Stats',
  links: 'Link List',
  products: 'Product Grid',
  music: 'Music',
  socials: 'Social Icons',
  brand_collabs: 'Brand Collabs',
  featured_link: 'Featured Link',
  text: 'Text Block',
  image: 'Image Block',
  embed: 'Custom Embed',
  divider: 'Divider',
};

const ALL_BLOCK_TYPES = new Set<CanvasLayoutBlockType>(Object.keys(BLOCK_TITLES) as CanvasLayoutBlockType[]);

const nextId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;

export const isLayoutBlockType = (value: unknown): value is CanvasLayoutBlockType =>
  typeof value === 'string' && ALL_BLOCK_TYPES.has(value as CanvasLayoutBlockType);

export const getLayoutBlockTitle = (type: CanvasLayoutBlockType): string => BLOCK_TITLES[type];

const createBlock = (
  type: CanvasLayoutBlockType,
  position: number,
  overrides?: Partial<CanvasLayoutBlock>,
): CanvasLayoutBlock => ({
  id: overrides?.id || nextId(type),
  type,
  title: overrides?.title?.trim() || BLOCK_TITLES[type],
  position,
  visible: overrides?.visible ?? true,
  data: overrides?.data ?? {},
});

type LayoutSeed = {
  links?: Record<string, string>;
  monetization?: CanvasMonetization;
};

const inferHasMusic = (links?: Record<string, string>): boolean =>
  Boolean(links?.spotify || links?.youtube);

const inferHasSocials = (links?: Record<string, string>): boolean =>
  Boolean(links?.instagram || links?.x || links?.github || links?.discord || links?.telegram);

export const createDefaultLayoutSchema = (seed?: LayoutSeed): CanvasLayoutSchema => {
  const blocks: CanvasLayoutBlock[] = [
    createBlock('hero', 0),
    createBlock('featured_link', 1),
    createBlock('links', 2),
    createBlock('products', 3, { visible: Boolean(seed?.monetization?.products?.length) }),
    createBlock('music', 4, { visible: inferHasMusic(seed?.links) }),
    createBlock('socials', 5, { visible: inferHasSocials(seed?.links) }),
    createBlock('stats', 6),
    createBlock('brand_collabs', 7, { visible: Boolean(seed?.monetization?.brandCollabs?.enabled) }),
  ];

  return {
    version: LAYOUT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    blocks,
  };
};

export const sanitizeLayoutSchema = (
  value: unknown,
  seed?: LayoutSeed,
): CanvasLayoutSchema => {
  const fallback = createDefaultLayoutSchema(seed);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const version =
    typeof record.version === 'number' && Number.isFinite(record.version)
      ? Math.max(1, Math.round(record.version))
      : LAYOUT_SCHEMA_VERSION;
  const updatedAt =
    typeof record.updatedAt === 'string' && record.updatedAt.length > 0
      ? record.updatedAt
      : new Date().toISOString();

  const rawBlocks = Array.isArray(record.blocks) ? record.blocks : [];
  const parsed: CanvasLayoutBlock[] = [];
  const seenIds = new Set<string>();

  rawBlocks.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return;
    }
    const item = raw as Record<string, unknown>;
    const typeRaw = item.type;
    if (!isLayoutBlockType(typeRaw)) {
      return;
    }

    const idRaw = typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : nextId(typeRaw);
    if (seenIds.has(idRaw)) {
      return;
    }
    seenIds.add(idRaw);

    const title = typeof item.title === 'string' && item.title.trim().length > 0 ? item.title.trim() : BLOCK_TITLES[typeRaw];
    const visible = Boolean(item.visible ?? true);
    const data = item.data && typeof item.data === 'object' && !Array.isArray(item.data)
      ? (item.data as Record<string, string | number | boolean | null>)
      : {};

    parsed.push(
      createBlock(typeRaw, index, {
        id: idRaw,
        title,
        visible,
        data,
      }),
    );
  });

  const trimmed = parsed.slice(0, MAX_LAYOUT_BLOCKS);
  const hasLinksBlock = trimmed.some((block) => block.type === 'links');
  if (!hasLinksBlock && trimmed.length < MAX_LAYOUT_BLOCKS) {
    trimmed.push(createBlock('links', trimmed.length));
  }

  const blocks = trimmed.length > 0 ? trimmed : fallback.blocks;

  return {
    version,
    updatedAt,
    blocks: blocks.map((block, index) => ({ ...block, position: index })),
  };
};

export const moveLayoutBlock = (
  blocks: CanvasLayoutBlock[],
  sourceId: string,
  targetId: string,
): CanvasLayoutBlock[] => {
  const sourceIndex = blocks.findIndex((item) => item.id === sourceId);
  const targetIndex = blocks.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return blocks;
  }

  const next = [...blocks];
  const [source] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, source);
  return next.map((item, index) => ({ ...item, position: index }));
};

export const shiftLayoutBlock = (
  blocks: CanvasLayoutBlock[],
  blockId: string,
  direction: -1 | 1,
): CanvasLayoutBlock[] => {
  const index = blocks.findIndex((item) => item.id === blockId);
  if (index < 0) {
    return blocks;
  }
  const target = index + direction;
  if (target < 0 || target >= blocks.length) {
    return blocks;
  }
  return moveLayoutBlock(blocks, blockId, blocks[target].id);
};

export const insertLayoutBlock = (
  blocks: CanvasLayoutBlock[],
  type: CanvasLayoutBlockType,
  atIndex: number,
): CanvasLayoutBlock[] => {
  if (blocks.length >= MAX_LAYOUT_BLOCKS) {
    return blocks;
  }
  const next = [...blocks];
  const clampedIndex = Math.max(0, Math.min(atIndex, next.length));
  next.splice(clampedIndex, 0, createBlock(type, clampedIndex));
  return next.map((item, index) => ({ ...item, position: index }));
};

export const duplicateLayoutBlock = (
  blocks: CanvasLayoutBlock[],
  blockId: string,
): CanvasLayoutBlock[] => {
  if (blocks.length >= MAX_LAYOUT_BLOCKS) {
    return blocks;
  }
  const index = blocks.findIndex((item) => item.id === blockId);
  if (index < 0) {
    return blocks;
  }
  const source = blocks[index];
  const copy = createBlock(source.type, index + 1, {
    title: `${source.title} Copy`,
    visible: source.visible,
    data: { ...(source.data ?? {}) },
  });
  const next = [...blocks];
  next.splice(index + 1, 0, copy);
  return next.map((item, i) => ({ ...item, position: i }));
};

