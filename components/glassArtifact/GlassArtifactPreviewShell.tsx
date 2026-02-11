import React from 'react';
import GlassArtifactApp from './App';
import ThemePreviewChrome from '../themePreviews/ThemePreviewChrome';

interface GlassArtifactPreviewShellProps {
  onClose: () => void;
  onUseTheme: () => void;
}

const GlassArtifactPreviewShell: React.FC<GlassArtifactPreviewShellProps> = ({ onClose, onUseTheme }) => {
  return (
    <ThemePreviewChrome
      onClose={onClose}
      onUseTheme={onUseTheme}
      desktopClassName="bg-black"
      controlsDark
    >
      <GlassArtifactApp />
    </ThemePreviewChrome>
  );
};

export default GlassArtifactPreviewShell;
