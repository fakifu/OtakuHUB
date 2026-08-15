import React from 'react';
import { UI } from '../../../designSystem';


export default function Input({ className = '', type = 'text', ...props }) {
  // Enforce numeric decimal keyboard for mobile numbers (to have comma)
  const inputMode =
    props.inputMode || (type === 'number' ? 'decimal' : undefined);

  return (
    <input
      type={type}
      inputMode={inputMode}
      className={`${UI.forms.input} ${className}`}
      {...props}
    />
  );
}
