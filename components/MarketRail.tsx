
import React from 'react';
import { TrendingUp, DollarSign, ExternalLink, ArrowRight } from 'lucide-react';
import { VibeApp } from '../types';

interface MarketRailProps {
  apps: VibeApp[];
  onViewAllMarketplace?: () => void;
}

const MarketRail: React.FC<MarketRailProps> = ({ apps, onViewAllMarketplace }) => {
  const marketplaceItems = apps
    .filter((app) => app.isForSale)
    .slice(0, 3)
    .map((app) => ({
      id: app.id,
      name: app.name,
      askingPrice: app.askingPrice ?? `$${Math.max(50, Math.round(app.monthlyRevenue * 0.024))}k`,
      status: 'For Sale' as const,
    }));

  const fallbackMarketplace = apps.slice(0, 3).map((app) => ({
    id: app.id,
    name: app.name,
    askingPrice: `$${Math.max(50, Math.round(app.monthlyRevenue * 0.024))}k`,
    status: 'Pending' as const,
  }));

  const trendingItems = [...apps]
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 4)
    .map((app) => ({
      id: app.id,
      name: app.name,
      change: app.growth,
    }));

  const itemsToShow = marketplaceItems.length > 0 ? marketplaceItems : fallbackMarketplace;

  return (
    <aside className="flex flex-col gap-8 py-4 min-w-0">
      {/* Marketplace Widget */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[#D4AF37] font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <DollarSign className="w-3 h-3" /> Marketplace
          </h4>
          <button 
            onClick={onViewAllMarketplace}
            className="text-[10px] text-[#D4AF37] font-black uppercase tracking-tighter hover:text-white transition-colors flex items-center gap-1 group"
          >
            View All <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          {itemsToShow.map(item => (
            <div 
              key={item.id}
              className={`p-4 rounded-xl border transition-colors group cursor-pointer
                ${item.status === 'Pending' 
                  ? 'bg-zinc-900/40 border-zinc-800' 
                  : 'bg-yellow-900/10 border-yellow-500/20 hover:border-yellow-500/40'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-white font-bold text-sm tracking-tight">{item.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.status === 'Pending' ? 'bg-zinc-800 text-zinc-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                  {item.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono-data text-white text-base">{item.askingPrice}</span>
                <span className="text-[10px] text-zinc-400 font-semibold group-hover:text-white transition-colors flex items-center gap-1">
                  Contact <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending / Velocity Widget */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-3 h-3" /> Trending
          </h4>
        </div>
        
        <div className="bg-[#050505] rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden">
          {trendingItems.map(item => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
              <div className="flex flex-col">
                <span className="text-zinc-200 text-sm font-semibold group-hover:text-white">{item.name}</span>
                <span className="text-[10px] text-zinc-500 font-medium">VELOCITY SCORE</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Mock Sparkline */}
                <div className="w-16 h-8 flex items-end gap-[2px]">
                   {[40, 60, 45, 80, 55, 90, 75].map((h, i) => (
                     <div 
                      key={i} 
                      className="flex-1 bg-green-500/40 rounded-t-[1px]" 
                      style={{ height: `${h}%`, opacity: (i + 1) / 7 }}
                     />
                   ))}
                </div>
                <span className={`font-mono-data text-xs ${item.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {item.change > 0 ? '+' : ''}{item.change}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default MarketRail;
