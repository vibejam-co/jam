import React from 'react';

interface ThemeIdentityBadgeProps {
  name: string;
  handle: string;
  avatar?: string;
  compact?: boolean;
  fixed?: boolean;
}

const ThemeIdentityBadge: React.FC<ThemeIdentityBadgeProps> = ({
  name,
  handle,
  avatar,
  compact = false,
  fixed = false,
}) => {
  return (
    <div className={`${fixed ? 'fixed' : 'absolute'} z-30 pointer-events-none ${compact ? 'top-2 left-2' : 'top-4 left-4'}`}>
      <div className={`flex items-center gap-2 rounded-2xl border border-white/20 bg-black/55 backdrop-blur-md text-white ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full object-cover border border-white/20`}
          />
        ) : (
          <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-white/15 border border-white/20`} />
        )}
        <div className="min-w-0">
          <div className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold truncate max-w-[130px]`}>{name}</div>
          <div className={`${compact ? 'text-[8px]' : 'text-[10px]'} text-white/60 truncate max-w-[130px]`}>{handle}</div>
        </div>
      </div>
    </div>
  );
};

export default ThemeIdentityBadge;
