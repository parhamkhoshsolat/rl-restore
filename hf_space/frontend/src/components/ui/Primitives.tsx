// Small shared UI primitives (button, pill, panel, segmented control).
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './primitives.css';

type BtnVariant = 'primary' | 'ghost' | 'outline' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  active?: boolean;
}

export function Button({ variant = 'outline', active, className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={`btn btn--${variant} ${active ? 'is-active' : ''} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Pill({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warn' | 'danger';
  className?: string;
}) {
  return <span className={`pill pill--${tone} ${className}`}>{children}</span>;
}

export function Panel({
  children,
  className = '',
  elevated,
  glow,
}: {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  glow?: boolean;
}) {
  return (
    <div className={`panel ${elevated ? 'panel--elevated' : ''} ${glow ? 'panel--glow' : ''} ${className}`}>
      {children}
    </div>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}) {
  return (
    <div className={`segmented segmented--${size}`} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          className={`segmented__opt ${value === o.value ? 'is-active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 9)) }}
      aria-hidden
    />
  );
}
