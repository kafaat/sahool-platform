/**
 * Enhanced Form Components
 * مكونات نماذج محسّنة
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';

/**
 * Form Field with Validation
 * حقل نموذج مع التحقق
 */
interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

export function FormField({ 
  label, 
  error, 
  helperText, 
  required, 
  icon,
  className,
  ...props 
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-error mr-1">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            setHasValue(!!e.target.value);
            props.onBlur?.(e);
          }}
          className={cn(
            'w-full rounded-lg border px-4 py-2.5 text-sm transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            icon && 'pr-10',
            error 
              ? 'border-error focus:ring-error focus:border-error' 
              : 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500',
            isFocused && 'shadow-sm',
            className
          )}
        />
        
        {error && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-error" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-error flex items-center gap-1">
          <X className="h-3 w-3" />
          {error}
        </p>
      )}
      
      {!error && helperText && (
        <p className="text-xs text-neutral-500">{helperText}</p>
      )}
    </div>
  );
}

/**
 * Password Field with Toggle
 * حقل كلمة المرور مع إظهار/إخفاء
 */
interface PasswordFieldProps extends Omit<FormFieldProps, 'type'> {
  showStrength?: boolean;
}

export function PasswordField({ showStrength = false, ...props }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);

  const calculateStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    return score;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (showStrength) {
      setStrength(calculateStrength(e.target.value));
    }
    props.onChange?.(e);
  };

  const strengthLabels = ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'قوية', 'قوية جداً'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

  return (
    <div className="space-y-2">
      <FormField
        {...props}
        type={showPassword ? 'text' : 'password'}
        onChange={handleChange}
        icon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
      
      {showStrength && strength > 0 && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-300',
                  level <= strength ? strengthColors[strength - 1] : 'bg-neutral-200'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-neutral-600">
            قوة كلمة المرور: <span className="font-medium">{strengthLabels[strength - 1]}</span>
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Select Field with Search
 * حقل اختيار مع بحث
 */
interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  searchable?: boolean;
  placeholder?: string;
}

export function SelectField({
  label,
  options,
  value,
  onChange,
  error,
  required,
  searchable = false,
  placeholder = 'اختر...',
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-error mr-1">*</span>}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full rounded-lg border px-4 py-2.5 text-sm text-right transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            error
              ? 'border-error focus:ring-error'
              : 'border-neutral-300 focus:ring-primary-500',
            !selectedOption && 'text-neutral-400'
          )}
        >
          {selectedOption?.label || placeholder}
        </button>
        
        {isOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-lg border border-neutral-200 bg-white shadow-lg">
            {searchable && (
              <div className="p-2 border-b border-neutral-200">
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}
            
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-right text-sm transition-colors',
                    'hover:bg-primary-50',
                    option.value === value && 'bg-primary-100 text-primary-700 font-medium'
                  )}
                >
                  {option.label}
                  {option.value === value && (
                    <Check className="inline-block mr-2 h-4 w-4" />
                  )}
                </button>
              ))}
              
              {filteredOptions.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-neutral-500">
                  لا توجد نتائج
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-error flex items-center gap-1">
          <X className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Textarea with Character Count
 * منطقة نص مع عداد الأحرف
 */
interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

export function TextareaField({
  label,
  error,
  required,
  maxLength,
  showCount = true,
  className,
  ...props
}: TextareaFieldProps) {
  const [count, setCount] = useState(0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-error mr-1">*</span>}
        </label>
        
        {showCount && maxLength && (
          <span className="text-xs text-neutral-500">
            {count} / {maxLength}
          </span>
        )}
      </div>
      
      <textarea
        {...props}
        maxLength={maxLength}
        onChange={(e) => {
          setCount(e.target.value.length);
          props.onChange?.(e);
        }}
        className={cn(
          'w-full rounded-lg border px-4 py-2.5 text-sm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'resize-none',
          error
            ? 'border-error focus:ring-error'
            : 'border-neutral-300 focus:ring-primary-500',
          className
        )}
      />
      
      {error && (
        <p className="text-xs text-error flex items-center gap-1">
          <X className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Checkbox with Label
 * مربع اختيار مع تسمية
 */
interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export function CheckboxField({ label, checked, onChange, description }: CheckboxFieldProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div
          className={cn(
            'h-5 w-5 rounded border-2 transition-all duration-200',
            'peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2',
            checked
              ? 'bg-primary-500 border-primary-500'
              : 'border-neutral-300 group-hover:border-primary-400'
          )}
        >
          {checked && <Check className="h-4 w-4 text-white" />}
        </div>
      </div>
      
      <div className="flex-1">
        <div className="text-sm font-medium text-neutral-900">{label}</div>
        {description && (
          <div className="text-xs text-neutral-600 mt-1">{description}</div>
        )}
      </div>
    </label>
  );
}

export default {
  FormField,
  PasswordField,
  SelectField,
  TextareaField,
  CheckboxField,
};
