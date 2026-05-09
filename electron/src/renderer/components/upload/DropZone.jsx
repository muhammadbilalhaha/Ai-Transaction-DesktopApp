import React, { useRef } from 'react';
import { HiUpload, HiPhotograph, HiExclamationCircle } from 'react-icons/hi';
import { useFileUpload } from '../../hooks/useFileUpload';

const DropZone = () => {
    const fileInputRef = useRef(null);
    const {
        error,
        isDragActive,
        handleDrop,
        handleDragOver,
        handleDragLeave,
        handleFileSelect,
        clearError,
    } = useFileUpload();

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all ${isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : error
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}
            >
                {error ? (
                    <>
                        <HiExclamationCircle className="mx-auto h-12 w-12 text-red-400" />
                        <p className="mt-3 text-sm text-red-600">{error}</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                clearError();
                            }}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                        >
                            Try again
                        </button>
                    </>
                ) : (
                    <>
                        <HiUpload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-3 text-sm text-gray-600">
                            <span className="font-medium text-blue-600">Click to upload</span>{' '}
                            or drag and drop
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                            Single or multiple screenshots
                        </p>
                        <div className="mt-2 flex items-center justify-center space-x-1 text-xs text-gray-500">
                            <HiPhotograph className="h-4 w-4" />
                            <span>PNG, JPG, JPEG, WEBP up to 10MB</span>
                        </div>
                    </>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleFileSelect}
                multiple
                className="hidden"
            />
        </div>
    );
};

export default DropZone;
