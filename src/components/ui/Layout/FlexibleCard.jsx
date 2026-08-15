import React from 'react';
import { UI } from '../../../designSystem';

/**
 * Universal adaptive card for dashboard sections.
 * Use 'rounded-bigbox' for large containers and 'rounded-card' for standard ones.
 */
export default function FlexibleCard({
    children,
    variant = 'standard', // 'standard' or 'large'
    className = '',
    noPadding = false,
    onClick,
    ...props
}) {
    // Use tokens from designSystem
    const baseClass = `${UI.cards.base} ${variant === 'large' ? 'rounded-bigbox' : 'rounded-card'} ${noPadding ? 'p-0' : 'p-6'}`;
    const interactiveClass = onClick ? UI.cards.flexible.interactive : '';

    return (
        <div
            className={`${baseClass} ${interactiveClass} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
}
