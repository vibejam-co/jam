import React from 'react';
import EtherealLiquidApp from './App';
import ThemePreviewChrome from '../themePreviews/ThemePreviewChrome';

interface EtherealLiquidPreviewShellProps {
  onClose: () => void;
  onUseTheme: () => void;
}

const EtherealLiquidPreviewShell: React.FC<EtherealLiquidPreviewShellProps> = ({ onClose, onUseTheme }) => {
  return (
    <ThemePreviewChrome
      onClose={onClose}
      onUseTheme={onUseTheme}
      desktopClassName="bg-[#F0F4F8]"
      mobileFrameClassName="bg-[#F0F4F8]"
    >
      <EtherealLiquidApp />
    </ThemePreviewChrome>
  );
};

export default EtherealLiquidPreviewShell;
