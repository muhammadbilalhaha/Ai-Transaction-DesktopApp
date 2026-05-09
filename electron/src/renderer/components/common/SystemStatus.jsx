import React from 'react';
import { HiStatusOnline } from 'react-icons/hi';

const SystemStatus = () => {
    return (
        <span className="inline-flex items-center space-x-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            <HiStatusOnline className="h-3.5 w-3.5" />
            <span>System Ready</span>
        </span>
    );
};

export default SystemStatus;