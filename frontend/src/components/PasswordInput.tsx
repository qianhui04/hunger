import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle?: () => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  showToggle?: boolean;
  labelClassName?: string;
  inputClassName?: string;
  toggleClassName?: string;
  iconSize?: number;
}

/** Shared password field UI. Password validation and visibility state stay in the page. */
export function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder = '',
  disabled = false,
  required = true,
  showToggle = true,
  labelClassName = 'block text-sm font-medium text-[#212121] mb-2',
  inputClassName = 'w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg bg-[#F5FAF5] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all',
  toggleClassName = 'absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#2E7D32] transition-colors',
  iconSize = 20,
}: PasswordInputProps) {
  return (
    <div>
      <label className={labelClassName}>{label}</label>
      <div className="relative">
        <Lock
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]"
          size={iconSize}
          aria-hidden="true"
        />
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          className={inputClassName}
        />
        {showToggle && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className={toggleClassName}
          >
            {visible ? <EyeOff size={iconSize} /> : <Eye size={iconSize} />}
          </button>
        )}
      </div>
    </div>
  );
}
