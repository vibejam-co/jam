import React from 'react';
import ThemePreviewChrome from '../themePreviews/ThemePreviewChrome';
import AccordionDeckApp from './accordionDeck/App';

interface AccordionDeckCollectionPreviewShellProps {
  onClose: () => void;
  onUseTemplate: () => void;
}

const AccordionDeckCollectionPreviewShell: React.FC<AccordionDeckCollectionPreviewShellProps> = ({
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
      <AccordionDeckApp />
    </ThemePreviewChrome>
  );
};

export default AccordionDeckCollectionPreviewShell;
