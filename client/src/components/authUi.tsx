import type { ReactNode } from 'react';

/** Full-screen centered dark shell used by login + onboarding screens. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-white flex justify-center">
      <div className="w-full max-w-mobile min-h-screen flex flex-col px-6 pt-safe pb-safe">
        {children}
      </div>
    </div>
  );
}

/** Primary CTA button, full width, brand accent. */
export function BigButton({
  children, onClick, disabled, type = 'button', variant = 'primary',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'ghost';
}) {
  const base =
    'w-full h-13 min-h-[52px] rounded-2xl text-cardtitle font-semibold transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100';
  const styles =
    variant === 'primary'
      ? 'bg-accent text-bg shadow-[0_8px_24px_-8px_rgba(139,143,255,0.6)]'
      : 'bg-white/8 text-white';
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

/** Labelled text/number input styled for the dark theme. */
export function Field({
  label, value, onChange, placeholder, type = 'text', autoFocus, inputMode, maxLength,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
  inputMode?: 'text' | 'numeric' | 'tel';
  maxLength?: number;
}) {
  return (
    <label className="block">
      {label && <span className="block text-caption text-gray mb-2 px-1">{label}</span>}
      <input
        className="w-full h-13 min-h-[52px] rounded-2xl bg-white/6 border border-white/10 px-4 text-cardtitle text-white placeholder:text-gray/60 outline-none focus:border-accent focus:bg-white/8 transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoFocus={autoFocus}
        inputMode={inputMode}
        maxLength={maxLength}
      />
    </label>
  );
}

/** A vertical stack of selectable option cards (single-select). */
export function OptionCards<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; title: string; desc?: string; icon?: ReactNode }[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`text-left rounded-2xl px-4 py-3.5 border transition-all active:scale-[0.99] ${
              active
                ? 'bg-accent/15 border-accent'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              {o.icon && <span className={active ? 'text-accent' : 'text-gray'}>{o.icon}</span>}
              <div className="flex-1 min-w-0">
                <p className={`text-body font-semibold ${active ? 'text-white' : 'text-gray-light'}`}>{o.title}</p>
                {o.desc && <p className="text-caption text-gray mt-0.5">{o.desc}</p>}
              </div>
              <span
                className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                  active ? 'border-accent' : 'border-white/25'
                }`}
              >
                {active && <span className="w-2.5 h-2.5 rounded-full bg-accent" />}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** A toggle row (used for skills). */
export function ToggleRow({
  title, desc, icon, on, onToggle,
}: {
  title: string;
  desc?: string;
  icon?: ReactNode;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left rounded-2xl px-4 py-3.5 border transition-all active:scale-[0.99] ${
        on ? 'bg-accent/10 border-accent/60' : 'bg-white/5 border-white/10'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon && <span className={on ? 'text-accent' : 'text-gray'}>{icon}</span>}
        <div className="flex-1 min-w-0">
          <p className={`text-body font-semibold ${on ? 'text-white' : 'text-gray-light'}`}>{title}</p>
          {desc && <p className="text-caption text-gray mt-0.5">{desc}</p>}
        </div>
        <span
          className={`w-11 h-6 rounded-full shrink-0 relative transition-colors ${
            on ? 'bg-accent' : 'bg-white/15'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
              on ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </span>
      </div>
    </button>
  );
}

/** Slim progress bar for the wizard. */
export function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-accent' : 'bg-white/12'}`}
        />
      ))}
    </div>
  );
}
