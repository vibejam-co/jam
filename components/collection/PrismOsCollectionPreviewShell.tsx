import React from 'react';
import ThemePreviewChrome from '../themePreviews/ThemePreviewChrome';
import PrismOsApp from './prismOs/App';

interface PrismOsCollectionPreviewShellProps {
  onClose: () => void;
  onUseTemplate: () => void;
}

const PrismOsCollectionPreviewShell: React.FC<PrismOsCollectionPreviewShellProps> = ({
  onClose,
  onUseTemplate,
}) => {
  return (
    <ThemePreviewChrome
      onClose={onClose}
      onUseTheme={onUseTemplate}
      desktopClassName="bg-black"
      mobileFrameClassName="bg-black"
      controlsDark
    >
      <PrismOsApp />
    </ThemePreviewChrome>
  );
};

export default PrismOsCollectionPreviewShell;
