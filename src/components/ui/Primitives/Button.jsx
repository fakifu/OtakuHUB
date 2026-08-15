import React from 'react';
import { UI } from '../../../designSystem';
import { Loader2 } from 'lucide-react';

/**
 * The ONE and ONLY Button component.
 * Supports: primary, outline, ghost, success, danger variants.
 */
export default function Button({
    children,
    variant = 'primary',
    category = 'primary', // 'primary' par défaut, prêt pour 'secondary' si besoin
    isLoading = false,
    disabled = false,
    isSquare = false,
    glow = true, // Default to true for the premium feel
    className = '',
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    onClick,
    ...props
}) {
    const baseStyles = UI.buttons.base;
    const variants = UI.buttons.variants;
    
    // Récupération de la configuration de catégorie (primary ou secondary)
    const catConfig = UI.buttons[category] || UI.buttons.primary;
    const currentVariant = variants[variant] || variants.primary;

    // Détermination de la dimension carrée ou rectangulaire
    const heightClass = catConfig.height;
    const roundedClass = catConfig.rounded;
    const paddingClass = isSquare ? 'p-0' : catConfig.padding;
    const squareWidthClass = isSquare ? `aspect-square ${heightClass.replace('h-', 'w-')}` : '';
    const textSizeClass = catConfig.textSize;

    // Add glow effect based on variant
    let shadowGlowClass = '';
    if (glow && !disabled && !isLoading) {
        if (variant === 'primary') shadowGlowClass = 'shadow-indigo-500/40 shadow-lg';
        if (variant === 'success') shadowGlowClass = 'shadow-emerald-500/40 shadow-lg';
        if (variant === 'danger') shadowGlowClass = 'shadow-red-500/40 shadow-lg';
        if (variant === 'warning') shadowGlowClass = 'shadow-amber-500/40 shadow-lg';
    }

    // Disabled override style
    let disabledClass = '';
    if (disabled || isLoading) {
        if (['primary', 'success', 'danger'].includes(variant)) {
            disabledClass = '!bg-gray-800 !text-gray-500 !shadow-none cursor-not-allowed';
        }
    }

    return (
        <button
            disabled={disabled || isLoading}
            onClick={(e) => {
                if (onClick) onClick(e);
            }}
            className={`${baseStyles} ${currentVariant} ${heightClass} ${roundedClass} ${paddingClass} ${squareWidthClass} ${textSizeClass} ${shadowGlowClass} ${disabledClass} ${className}`}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
            ) : (
                <div className="flex items-center justify-center gap-2 w-full h-full">
                    {LeftIcon && <LeftIcon size={isSquare ? 20 : 18} className="shrink-0" />}
                    {children && <span className="truncate">{children}</span>}
                    {RightIcon && <RightIcon size={isSquare ? 20 : 18} className="shrink-0" />}
                </div>
            )}
        </button>
    );
}
