import React from 'react';
import CreatorHubApp from './App';
import ThemePreviewChrome from '../themePreviews/ThemePreviewChrome';

interface CreatorHubPreviewShellProps {
  onClose: () => void;
  onUseTheme: () => void;
}

const CreatorHubPreviewShell: React.FC<CreatorHubPreviewShellProps> = ({ onClose, onUseTheme }) => {
  return (
    <ThemePreviewChrome
      onClose={onClose}
      onUseTheme={onUseTheme}
      desktopClassName="bg-[#FDFBF7]"
      mobileFrameClassName="bg-[#FDFBF7]"
    >
      <div className="min-h-full bg-[#FDFBF7] text-[#332D2B]">
        <CreatorHubApp />
      </div>
    </ThemePreviewChrome>
  );
};

export default CreatorHubPreviewShell;
