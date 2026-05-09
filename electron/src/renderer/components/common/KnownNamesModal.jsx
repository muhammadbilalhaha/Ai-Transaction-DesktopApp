import React, { useState, useEffect } from 'react';
import {
    HiX,
    HiPlus,
    HiTrash,
    HiUser,
    HiOfficeBuilding,
} from 'react-icons/hi';
import {
    getKnownSenders,
    getKnownReceivers,
    addKnownSender,
    addKnownReceiver,
    removeKnownSender,
    removeKnownReceiver,
} from '../../utils/nameMatcher';

const KnownNamesModal = ({ isOpen, onClose }) => {
    const [senders, setSenders] = useState([]);
    const [receivers, setReceivers] = useState([]);
    const [newSender, setNewSender] = useState('');
    const [newReceiver, setNewReceiver] = useState('');
    const [activeTab, setActiveTab] = useState('senders');

    useEffect(() => {
        if (isOpen) {
            loadNames();
        }
    }, [isOpen]);

    const loadNames = () => {
        setSenders(getKnownSenders());
        setReceivers(getKnownReceivers());
    };

    const handleAddSender = async () => {
        const name = newSender.trim();
        if (name && name.length >= 3) {
            await addKnownSender(name);
            setNewSender('');
            loadNames();
        }
    };

    const handleAddReceiver = async () => {
        const name = newReceiver.trim();
        if (name && name.length >= 3) {
            await addKnownReceiver(name);
            setNewReceiver('');
            loadNames();
        }
    };

    const handleRemoveSender = async (name) => {
        await removeKnownSender(name);
        loadNames();
    };

    const handleRemoveReceiver = async (name) => {
        await removeKnownReceiver(name);
        loadNames();
    };

    const handleKeyDown = (e, type) => {
        if (e.key === 'Enter') {
            if (type === 'sender') handleAddSender();
            else handleAddReceiver();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/70 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                    <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                            <HiUser className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Known Names</h3>
                            <p className="text-xs text-purple-100">Manage senders & receivers for auto-correction</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white">
                        <HiX className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('senders')}
                        className={`flex flex-1 items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'senders' ? 'border-b-2 border-indigo-500 bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <HiUser className="h-4 w-4" />
                        <span>Senders ({senders.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('receivers')}
                        className={`flex flex-1 items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'receivers' ? 'border-b-2 border-indigo-500 bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <HiOfficeBuilding className="h-4 w-4" />
                        <span>Receivers ({receivers.length})</span>
                    </button>
                </div>

                <div className="max-h-[50vh] overflow-y-auto p-6">
                    {activeTab === 'senders' ? (
                        <div className="space-y-4">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Enter sender name (e.g., Muhammad Saleem)"
                                    value={newSender}
                                    onChange={(e) => setNewSender(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, 'sender')}
                                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={handleAddSender}
                                    disabled={!newSender.trim()}
                                    className="flex items-center space-x-1 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                                >
                                    <HiPlus className="h-4 w-4" />
                                    <span>Add</span>
                                </button>
                            </div>

                            {senders.length === 0 ? (
                                <div className="rounded-xl bg-gray-50 py-8 text-center">
                                    <HiUser className="mx-auto h-10 w-10 text-gray-300" />
                                    <p className="mt-2 text-sm text-gray-500">No known senders yet</p>
                                    <p className="text-xs text-gray-400">Add names to auto-correct OCR errors</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium uppercase text-gray-500">Known Senders ({senders.length})</p>
                                    {senders.map((name, index) => (
                                        <div key={index} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                                                    <HiUser className="h-4 w-4 text-indigo-600" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{name}</span>
                                            </div>
                                            <button onClick={() => handleRemoveSender(name)} className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500" title="Remove">
                                                <HiTrash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Enter receiver name (e.g., SSGC, K-Electric)"
                                    value={newReceiver}
                                    onChange={(e) => setNewReceiver(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, 'receiver')}
                                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={handleAddReceiver}
                                    disabled={!newReceiver.trim()}
                                    className="flex items-center space-x-1 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50"
                                >
                                    <HiPlus className="h-4 w-4" />
                                    <span>Add</span>
                                </button>
                            </div>

                            {receivers.length === 0 ? (
                                <div className="rounded-xl bg-gray-50 py-8 text-center">
                                    <HiOfficeBuilding className="mx-auto h-10 w-10 text-gray-300" />
                                    <p className="mt-2 text-sm text-gray-500">No known receivers yet</p>
                                    <p className="text-xs text-gray-400">Add company names to auto-correct</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium uppercase text-gray-500">Known Receivers ({receivers.length})</p>
                                    {receivers.map((name, index) => (
                                        <div key={index} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                                                    <HiOfficeBuilding className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{name}</span>
                                            </div>
                                            <button onClick={() => handleRemoveReceiver(name)} className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500" title="Remove">
                                                <HiTrash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <button onClick={onClose} className="w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KnownNamesModal;