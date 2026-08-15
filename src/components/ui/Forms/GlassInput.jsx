import React from 'react';
import { UI } from '../../../designSystem';

/**
 * GlassInput — Modular input with security and multiple design variants.
 * 
 * Variants:
 * - 'pill': Legacy/Standard design. Slightly translucent, rounded-full.
 * - 'glass': Primary design. Integrated glass-panel, rounded-card.
 * - 'plain': Transparent design. No background or border.
 */
export const glassInputClass = 'bg-transparent w-full h-full text-foreground font-bold outline-none border-none placeholder:text-muted/30 dark:[color-scheme:dark]';

export default function GlassInput({
    icon: Icon,
    iconClass = 'text-muted',
    label,
    type = 'text',
    variant = 'glass', // 'glass', 'pill', 'smoky', 'plain'
    className = '',
    containerClass = '',
    value,
    onChange,
    placeholder,
    children,
    inputClass = '',
    maxLength,
    labelPlacement = 'inside', // 'inside', 'top' (only relevant for smoky)
    labelAction,
    ...props
}) {
    const handleKeyDown = (e) => {
        if (type === 'number') {
            if (['e', 'E', '+', '-'].includes(e.key)) {
                e.preventDefault();
            }
        }
    };

    const handleChange = (e) => {
        if (!onChange) return;

        if (type === 'number') {
            let val = e.target.value;
            val = val.replace(',', '.');

            // Allow % sign for percentage calculations
            const hasPct = val.includes('%');
            const numPart = val.replace('%', '');

            if (numPart !== '' && parseFloat(numPart) < 0) {
                val = hasPct ? '0%' : '0';
            }
            e.target.value = val;
            onChange(e);
        } else {
            onChange(e);
        }
    };

    const isSmoky = variant === 'smoky';
    const showLabelOutside = !isSmoky || labelPlacement === 'top';

    const variantStyles = {
        glass: `glass-panel rounded-card h-14 px-4 focus-within:bg-white/[0.08] dark:focus-within:bg-white/[0.12]`,
        smoky: `${UI.cards.smoky} p-2 md:p-2.5 flex gap-2 md:gap-3 min-h-[52px]`,
        pill: `bg-white/[0.05] border border-white/10 rounded-full h-12 px-4 focus-within:bg-white/[0.1]`,
        plain: `bg-transparent border-none p-0 h-auto`,
    };

    const isMultiline = Boolean(props.rows) || type === 'textarea';
    const alignClass = (isSmoky && (labelPlacement === 'inside' || isMultiline)) ? 'items-start' : 'items-center';
    const baseStyle = `flex ${alignClass} transition-colors ${variantStyles[variant] || variantStyles.glass} ${className}`;

    const inputElement = children ? (
        children
    ) : isMultiline ? (
        <textarea
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`${glassInputClass} ${inputClass} resize-none custom-scrollbar`}
            {...props}
        />
    ) : (
        <input
            type={type === 'number' ? 'text' : type}
            inputMode={type === 'number' ? 'decimal' : undefined}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`${glassInputClass} ${inputClass}`}
            {...props}
        />
    );

    return (
        <div className={`space-y-2 ${containerClass}`}>
            {label && showLabelOutside && (
                <div className="flex justify-between items-center w-full px-1">
                    <label className={isSmoky ? UI.forms.labelSmoky : UI.forms.label}>
                        {label}
                    </label>
                    {maxLength && value && typeof value === 'string' && (
                        <span className={`text-[9px] font-medium transition-colors ${value.length >= maxLength ? 'text-red-400' : 'text-gray-500 opacity-40'}`}>
                            {value.length}/{maxLength}
                        </span>
                    )}
                    {labelAction}
                </div>
            )}
            <div className={`glass-input-root ${baseStyle}`}>
                {Icon && (
                    isSmoky ? (
                        <div className={`w-9 h-9 rounded-list bg-background/50 flex items-center justify-center shrink-0 mr-3 ${isMultiline ? 'mt-1' : ''}`}>
                            <Icon size={16} className={iconClass} />
                        </div>
                    ) : (
                        <Icon size={18} className={`${iconClass} ${isMultiline ? 'self-start mt-1' : ''} shrink-0 mr-3`} />
                    )
                )}

                <div className={`flex-1 h-full flex ${isSmoky && labelPlacement === 'inside' && label ? 'flex-col justify-center' : 'items-center'}`}>
                    {label && isSmoky && labelPlacement === 'inside' && (
                        <div className="flex justify-between items-center w-full pr-1">
                            <label className={UI.forms.labelSmoky}>
                                {label}
                            </label>
                            {maxLength && value && typeof value === 'string' && (
                                <span className={`text-[9px] font-medium transition-colors ${value.length >= maxLength ? 'text-red-400' : 'text-gray-500 opacity-40'}`}>
                                    {value.length}/{maxLength}
                                </span>
                            )}
                            {labelAction}
                        </div>
                    )}
                    {inputElement}
                </div>
            </div>
        </div>
    );
}
