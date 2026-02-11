import React from 'react';
import MidnightZenithApp from './App';
import ThemePreviewChrome from '../themePreviews/ThemePreviewChrome';

interface MidnightZenithPreviewShellProps {
  onClose: () => void;
  onUseTheme: () => void;
}

const MidnightZenithPreviewShell: React.FC<MidnightZenithPreviewShellProps> = ({ onClose, onUseTheme }) => {
  return (
    <ThemePreviewChrome
      onClose={onClose}
      onUseTheme={onUseTheme}
      desktopClassName="bg-[#050505]"
      controlsDark
    >
      <MidnightZenithApp />
    </ThemePreviewChrome>
  );
};

export default MidnightZenithPreviewShell;
