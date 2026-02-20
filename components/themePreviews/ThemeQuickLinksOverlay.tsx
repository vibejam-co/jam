import React from 'react';
import { ExternalLink } from 'lucide-react';

type QuickLink = {
  id: string;
  title: string;
  url: string;
};

interface ThemeQuickLinksOverlayProps {
  links: QuickLink[];
  compact?: boolean;
  fixed?: boolean;
}

const ThemeQuickLinksOverlay: React.FC<ThemeQuickLinksOverlayProps> = ({ links, compact = false, fixed = false }) => {
  const visible = links.filter((item) => item.url && item.url !== '#').slice(0, compact ? 3 : 6);
  if (visible.length === 0) {
    return null;
  }

  return (
    <div className={`${fixed ? 'fixed' : 'absolute'} z-30 pointer-events-none ${compact ? 'left-2 bottom-2' : 'left-4 bottom-4'}`}>
      <div className={`pointer-events-auto flex flex-wrap gap-1.5 rounded-2xl border border-white/15 bg-black/55 backdrop-blur-md ${compact ? 'p-1.5 max-w-[160px]' : 'p-2 max-w-[280px]'}`}>
        {visible.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors ${compact ? 'px-2 py-1 text-[9px]' : 'px-2.5 py-1 text-[10px]'}`}
            title={link.title}
          >
            <span className="truncate max-w-[100px]">{link.title}</span>
            <ExternalLink className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          </a>
        ))}
      </div>
    </div>
  );
};

export default ThemeQuickLinksOverlay;
