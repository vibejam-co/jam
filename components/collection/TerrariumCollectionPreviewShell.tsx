import React from 'react';
import ThemePreviewChrome from '../themePreviews/ThemePreviewChrome';
import TerrariumApp from './terrarium/App';

interface TerrariumCollectionPreviewShellProps {
  onClose: () => void;
  onUseTemplate: () => void;
}

const TerrariumCollectionPreviewShell: React.FC<TerrariumCollectionPreviewShellProps> = ({
  onClose,
  onUseTemplate,
}) => {
  return (
    <ThemePreviewChrome
      onClose={onClose}
      onUseTheme={onUseTemplate}
      desktopClassName="bg-[#f7efc8]"
      mobileFrameClassName="bg-[#f7efc8]"
    >
      <TerrariumApp />
    </ThemePreviewChrome>
  );
};

export default TerrariumCollectionPreviewShell;
