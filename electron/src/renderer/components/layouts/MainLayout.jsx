import React from 'react';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';

const MainLayout = () => {
  return (
    <div className="flex flex-1 overflow-hidden">
      <LeftPanel />
      <CenterPanel />
      <RightPanel />
    </div>
  );
};

export default MainLayout;
