import React from 'react';
import ThemePreviewChrome from '../themePreviews/ThemePreviewChrome';
import GoldStandardApp from './goldStandard/App';

interface GoldStandardCollectionPreviewShellProps {
  onClose: () => void;
  onUseTemplate: () => void;
}

const GoldStandardCollectionPreviewShell: React.FC<GoldStandardCollectionPreviewShellProps> = ({
  onClose,
  onUseTemplate,
}) => {
  return (
    <ThemePreviewChrome
      onClose={onClose}
      onUseTheme={onUseTemplate}
      desktopClassName="bg-[#0A0A0A]"
      mobileFrameClassName="bg-[#0A0A0A]"
      controlsDark
    >
      <div className="relative min-h-full bg-[#0A0A0A] text-[#FBFBFB]">
        <GoldStandardApp />
        <div className="grain" />
      </div>
    </ThemePreviewChrome>
  );
};

export default GoldStandardCollectionPreviewShell;
