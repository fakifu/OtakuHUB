import React, { useRef } from 'react';


/**
 * A standardized numeric input component that:
 * - Enforces numeric keyboard on mobile (type="number", inputMode="decimal")
 * - Disables mouse wheel value changes
 * - Prevents text and invalid characters ('e', 'E', '+')
 * - Allows negative sign '-' only if min >= 0 is NOT set (or explicitly allowed)
 * - Supports all standard input props (value, onChange, placeholder, etc.)
 */
export default function NumberInput({
    className = '',
    min,
    max,
    onChange,
    ...props
}) {
    const inputRef = useRef(null);

    // Prevent scroll wheel validation
    const handleWheel = (e) => {
        // Prevent the default scroll behavior which changes the number
        e.target.blur();
    };

    const handleKeyDown = (e) => {
        // Block 'e', 'E', '+'
        if (['e', 'E', '+'].includes(e.key)) {
            e.preventDefault();
        }

        // Block '-' if min is 0 or greater (implies positive only)
        if (e.key === '-' && min !== undefined && Number(min) >= 0) {
            e.preventDefault();
        }
    };

    return (
        <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            onWheel={handleWheel}
            onKeyDown={handleKeyDown}
            onChange={onChange}
            className={`w-full bg-transparent border-none p-0 text-foreground outline-none placeholder:text-dim ${className}`}
            {...props}
        />
    );
}
