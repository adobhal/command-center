'use client';

import { cn } from '@/lib/utils';

export type Role = 'ceo' | 'cfo' | 'cso';

const ROLES: { id: Role; label: string }[] = [
  { id: 'ceo', label: 'CEO' },
  { id: 'cfo', label: 'CFO' },
  { id: 'cso', label: 'CSO' },
];

interface RoleToggleProps {
  role: Role;
  onRoleChange: (role: Role) => void;
}

export function RoleToggle({ role, onRoleChange }: RoleToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-700 dark:bg-slate-800/50">
      {ROLES.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onRoleChange(r.id)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
            role === r.id
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-50'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50'
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
