import React from 'react';
import ThemePreviewChrome from '../themePreviews/ThemePreviewChrome';
import AeroCanvasApp from './aeroCanvas/App';

interface AeroCanvasCollectionPreviewShellProps {
  onClose: () => void;
  onUseTemplate: () => void;
}

const AeroCanvasCollectionPreviewShell: React.FC<AeroCanvasCollectionPreviewShellProps> = ({
  onClose,
  onUseTemplate,
}) => {
  return (
    <ThemePreviewChrome
      onClose={onClose}
      onUseTheme={onUseTemplate}
      desktopClassName="bg-[#F8F9FA]"
      mobileFrameClassName="bg-[#F8F9FA]"
    >
      <AeroCanvasApp />
    </ThemePreviewChrome>
  );
};

export default AeroCanvasCollectionPreviewShell;
