import React from 'react';
import { UI } from '../../../designSystem';


/**
 * Optimized for items in a list (e.g., resell items, history entries).
 */
export default function ListCard({ 
    children, 
    title, 
    subtitle, 
    leftIcon: LeftIcon, 
    rightContent, 
    onClick, 
    className = '', 
    variant = 'lite' 
}) {
    // On utilise <div> avec un rôle button pour éviter l'erreur d'hydratation (button dans button)
    let baseClass = UI.cards.list;
    if (variant === 'full') {
        baseClass = baseClass.replace('glass-liquid-lite', 'glass-liquid');
    }

    return (
        <div
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            className={`${baseClass} ${onClick ? 'cursor-pointer text-left' : ''} ${className}`}
        >
            {children ? children : (
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        {LeftIcon && (
                            <div className="p-2.5 rounded-card bg-surface/50 text-accent shrink-0">
                                <LeftIcon size={18} />
                            </div>
                        )}
                        <div>
                            {title && <h4 className="text-sm font-bold text-foreground">{title}</h4>}
                            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
                        </div>
                    </div>
                    {rightContent && <div className="shrink-0">{rightContent}</div>}
                </div>
            )}
        </div>
    );
}
