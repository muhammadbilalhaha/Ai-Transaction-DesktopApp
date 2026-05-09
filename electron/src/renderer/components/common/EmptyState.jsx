import React from 'react';

const EmptyState = ({ icon: Icon, title, description, iconSize = 'large' }) => {
    const sizeClasses = {
        small: 'h-8 w-8',
        medium: 'h-12 w-12',
        large: 'h-20 w-20'
    };

    return (
        <div className="text-center">
            {Icon && (
                <Icon
                    className={`mx-auto ${sizeClasses[iconSize]} text-gray-300`}
                />
            )}
            {title && (
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                    {title}
                </h3>
            )}
            {description && (
                <p className="mt-2 text-sm text-gray-500">
                    {description}
                </p>
            )}
        </div>
    );
};

export default EmptyState;