'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onSearch?: (value: string) => void;
}

export function SearchInput({ placeholder = 'Search here...', ...props }: SearchInputProps) {
  return (
    <Input
      type="search"
      placeholder={placeholder}
      leftIcon={<Search size={18} />}
      {...props}
    />
  );
}
