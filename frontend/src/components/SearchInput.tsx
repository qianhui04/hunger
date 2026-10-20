import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  wrapperClassName?: string;
  inputClassName?: string;
  iconSize?: number;
  disabled?: boolean;
}

/** Shared search field; filtering and debounce behavior stay in the calling page. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  wrapperClassName = 'relative w-full',
  inputClassName = 'w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-[#F5FAF5] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent',
  iconSize = 18,
  disabled = false,
}: SearchInputProps) {
  return (
    <div className={wrapperClassName}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]"
        size={iconSize}
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName}
      />
    </div>
  );
}
