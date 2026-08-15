import React from 'react';
import { UI } from '../../../designSystem';

/**
 * Optimized for displaying key metrics and stats.
 */
export default function KPICard({ title, value, subtext, icon: Icon, trend, className = '', onClick, ...props }) {
    const interactiveClass = onClick
        ? UI.cards.kpiInteractive
        : '';

    return (
        <div
            onClick={onClick}
            className={`${UI.cards.kpi} ${interactiveClass} ${className}`}
            {...props}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-muted mb-1">{title}</p>
                    <h3 className="text-2xl font-black text-foreground">{value}</h3>
                </div>
                {Icon && (
                    <div className="p-2 bg-accent/10 rounded-item text-accent">
                        <Icon size={20} />
                    </div>
                )}
            </div>

            {(subtext || trend !== undefined) && (
                <div className="flex items-center gap-2">
                    {trend !== undefined && (
                        <span className={`text-xs font-bold ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
                            {trend >= 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                    {subtext && <span className="text-xs text-dim truncate">{subtext}</span>}
                </div>
            )}
        </div>
    );
}
