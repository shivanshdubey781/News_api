import React from 'react';
import type { Comparison } from '../api/types';

interface CompareTableProps {
  comparison: Comparison;
}

export const CompareTable: React.FC<CompareTableProps> = ({ comparison }) => {
  return (
    <div className="mt-2" role="region" aria-label="Outlet comparison table">
      <h3 className="text-sm font-medium text-[var(--color-text)] mb-2">
        Coverage of: <span className="font-mono text-xs text-[var(--color-text-secondary)]">{comparison.event}</span>
      </h3>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-xs border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-[var(--color-surface-alt)]">
              <th scope="col" className="text-left p-2 font-mono text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">Outlet</th>
              <th scope="col" className="text-left p-2 font-mono text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">Framing</th>
              <th scope="col" className="text-left p-2 font-mono text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">Omissions</th>
            </tr>
          </thead>
          <tbody>
            {comparison.outlets.map((outlet, i) => (
              <tr key={outlet.outlet} className={i % 2 === 0 ? '' : 'bg-[var(--color-surface-alt)]/50'}>
                <td className="p-2 font-medium align-top border-b border-[var(--color-border)]/50">
                  {outlet.outlet}
                </td>
                <td className="p-2 text-[var(--color-text-secondary)] align-top border-b border-[var(--color-border)]/50">
                  {outlet.framingNotes}
                </td>
                <td className="p-2 text-[var(--color-text-secondary)] align-top border-b border-[var(--color-border)]/50">
                  <ul className="list-disc list-inside space-y-0.5">
                    {outlet.omissions.map((o) => <li key={o}>{o}</li>)}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {comparison.agreements.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-mono text-[var(--color-text-secondary)] mb-1">Agreements:</p>
          <div className="flex flex-wrap gap-1">
            {comparison.agreements.map((a) => (
              <span key={a} className="px-2 py-0.5 rounded-full text-xs badge-verified">{a}</span>
            ))}
          </div>
        </div>
      )}

      {comparison.disagreements.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-mono text-[var(--color-text-secondary)] mb-1">Disagreements:</p>
          <div className="flex flex-wrap gap-1">
            {comparison.disagreements.map((d) => (
              <span key={d} className="px-2 py-0.5 rounded-full text-xs badge-disputed">{d}</span>
            ))}
          </div>
        </div>
      )}

      {comparison.singleSourceFlags.length > 0 && (
        <div className="mt-2 p-2 rounded-lg bg-[var(--color-badge-state)]/10 border border-[var(--color-badge-state)]/20">
          <p className="text-xs font-mono text-[var(--color-text-secondary)] mb-1">⚠ Single-source claims:</p>
          {comparison.singleSourceFlags.map((f) => (
            <p key={f} className="text-xs text-[var(--color-text)]">{f}</p>
          ))}
        </div>
      )}
    </div>
  );
};
