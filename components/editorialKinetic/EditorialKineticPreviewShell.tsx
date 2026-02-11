import React from 'react';
import EditorialKineticProfile from './EditorialKineticProfile';
import ThemePreviewChrome from '../themePreviews/ThemePreviewChrome';

interface EditorialKineticPreviewShellProps {
  onClose: () => void;
  onUseTheme: () => void;
}

const EditorialKineticPreviewShell: React.FC<EditorialKineticPreviewShellProps> = ({ onClose, onUseTheme }) => {
  return (
    <ThemePreviewChrome
      onClose={onClose}
      onUseTheme={onUseTheme}
      desktopClassName="bg-[#F0F0F0]"
      mobileFrameClassName="bg-[#F0F0F0]"
      mobileChildren={<EditorialKineticProfile isMobilePreview />}
    >
      <div className="cursor-none">
        <EditorialKineticProfile />
      </div>
    </ThemePreviewChrome>
  );
};

export default EditorialKineticPreviewShell;
