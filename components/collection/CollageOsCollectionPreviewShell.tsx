import React from 'react';
import ThemePreviewChrome from '../themePreviews/ThemePreviewChrome';
import CollageOsApp from './collageOs/App';

interface CollageOsCollectionPreviewShellProps {
  onClose: () => void;
  onUseTemplate: () => void;
}

const CollageOsCollectionPreviewShell: React.FC<CollageOsCollectionPreviewShellProps> = ({
  onClose,
  onUseTemplate,
}) => {
  return (
    <ThemePreviewChrome
      onClose={onClose}
      onUseTheme={onUseTemplate}
      desktopClassName="bg-[#f0ebe3]"
      mobileFrameClassName="bg-[#f0ebe3]"
    >
      <div className="relative min-h-full bg-[#f0ebe3]">
        <CollageOsApp />
        <div className="grain-overlay" />
      </div>
    </ThemePreviewChrome>
  );
};

export default CollageOsCollectionPreviewShell;
