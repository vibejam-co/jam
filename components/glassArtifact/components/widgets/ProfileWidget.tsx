
import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const DEFAULT_PROFILE = {
  name: 'Alex Sterling',
  role: 'Spatial Architect',
  bio:
    'Passionate about creating spatial computing experiences that blend the physical and digital worlds. Currently focused on "Frosted Aerogel" aesthetic explorations and elastic grid systems.',
  avatar: 'https://picsum.photos/400/400?random=1',
};

export const ProfileWidget: React.FC<{
  isExpanded?: boolean;
  profileOverride?: {
    name?: string;
    bio?: string;
    avatar?: string;
  };
}> = ({ isExpanded, profileOverride }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const profile = {
    name: profileOverride?.name?.trim() || DEFAULT_PROFILE.name,
    role: DEFAULT_PROFILE.role,
    bio: profileOverride?.bio?.trim() || DEFAULT_PROFILE.bio,
    avatar: profileOverride?.avatar?.trim() || DEFAULT_PROFILE.avatar,
  };

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isExpanded) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (isExpanded) {
    return (
      <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start text-white">
        <div className="w-36 h-36 md:w-48 md:h-48 rounded-[28px] md:rounded-[40px] overflow-hidden border-2 border-white/30 shadow-2xl shrink-0">
          <img src={profile.avatar} className="w-full h-full object-cover" alt={profile.name} />
        </div>
        <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2">{profile.name}</h1>
            <p className="text-white/60 text-base md:text-lg">Lead Interaction Designer @ VibeJam</p>
          </div>
          <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-xl">
            {profile.bio}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <button className="px-6 md:px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-white/90 transition-colors">
              Subscribe
            </button>
            <button className="px-6 md:px-8 py-3 bg-white/10 text-white rounded-full font-bold border border-white/20 hover:bg-white/20 transition-colors">
              Message
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-4 md:p-6 h-full flex flex-col md:flex-row items-center md:items-stretch gap-4 md:gap-6"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div 
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="w-full md:w-1/2 h-32 md:h-full rounded-2xl overflow-hidden relative shadow-lg"
      >
        <img src={profile.avatar} className="w-full h-full object-cover" alt={profile.name} />
      </motion.div>
      <div className="w-full md:w-1/2 flex flex-col justify-center">
        <h3 className="text-xl font-bold text-white mb-1">{profile.name}</h3>
        <p className="text-xs text-white/50 mb-4 uppercase tracking-wider">{profile.role}</p>
        <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-bold text-white transition-all">
          Subscribe
        </button>
      </div>
    </div>
  );
};
