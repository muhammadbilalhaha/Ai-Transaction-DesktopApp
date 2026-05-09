import React from 'react';
import DropZone from '../upload/DropZone';
import TransactionList from '../transactions/TransactionList';
import BatchProgressPanel from '../upload/BatchProgressPanel';

const LeftPanel = () => {
  return (
    <aside className="flex w-80 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-sm font-semibold tracking-wider text-gray-700 uppercase">
          Upload Screenshot
        </h2>
      </div>
      <div className="p-4">
        <DropZone />
      </div>
      <BatchProgressPanel />
      <TransactionList />
    </aside>
  );
};

export default LeftPanel;
