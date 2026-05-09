import React, { useState } from 'react';
import { HiCurrencyDollar, HiCog, HiUserGroup } from 'react-icons/hi';
import SystemStatus from '../common/SystemStatus';
import SettingsModal from '../common/SettingsModal';
import KnownNamesModal from '../common/KnownNamesModal';

const Header = () => {
    const [showSettings, setShowSettings] = useState(false);
    const [showKnownNames, setShowKnownNames] = useState(false);

    return (
        <>
            <header className="border-b border-gray-200 bg-white shadow-sm">
                <div className="mx-auto max-w-full px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {/* Premium Logo */}
                            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/20">
                                {/* Shine effect */}
                                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-white/30 blur-[1px]" />
                                <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-white/20 blur-[1px]" />

                                <span className="relative text-base font-extrabold tracking-tight text-white">
                                    Rs.
                                </span>
                            </div>

                            {/* Branding */}
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-gray-900">
                                    Transaction <span className="text-purple-600"> AI</span>
                                </h1>
                                <div className="flex items-center space-x-1.5">
                                    <span className="inline-block h-1 w-1 rounded-full bg-purple-400" />
                                    <p className="text-xs font-medium tracking-wide text-gray-400">
                                        Automated Accounting
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Known Names Button */}
                            <button
                                onClick={() => setShowKnownNames(true)}
                                className="flex items-center space-x-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                                title="Manage Known Names"
                            >
                                <HiUserGroup className="h-5 w-5" />
                                <span className="hidden sm:inline">Known Names</span>
                            </button>

                            {/* Settings Button */}
                            <button
                                onClick={() => setShowSettings(true)}
                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                title="Settings"
                            >
                                <HiCog className="h-5 w-5" />
                            </button>
                            <SystemStatus />
                        </div>
                    </div>
                </div>
            </header>

            <KnownNamesModal isOpen={showKnownNames} onClose={() => setShowKnownNames(false)} />
            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </>
    );
};

export default Header;