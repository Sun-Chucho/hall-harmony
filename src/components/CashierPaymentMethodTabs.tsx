import { cn } from '@/lib/utils';
import { PaymentMethod } from '@/types/payment';

export type CashierPaymentMethod = Extract<PaymentMethod, 'cash' | 'mobile_money' | 'bank_transfer'>;

const CASHIER_PAYMENT_METHOD_OPTIONS: { value: CashierPaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile' },
  { value: 'bank_transfer', label: 'Bank' },
];

export function normalizeCashierPaymentMethod(value?: PaymentMethod | null): CashierPaymentMethod {
  if (value === 'mobile_money' || value === 'bank_transfer' || value === 'cash') {
    return value;
  }

  return 'cash';
}

interface CashierPaymentMethodTabsProps {
  value?: PaymentMethod | null;
  onChange: (value: CashierPaymentMethod) => void;
  className?: string;
  buttonClassName?: string;
  label?: string;
  disabled?: boolean;
  hiddenInputName?: string;
}

export function CashierPaymentMethodTabs({
  value,
  onChange,
  className,
  buttonClassName,
  label,
  disabled = false,
  hiddenInputName,
}: CashierPaymentMethodTabsProps) {
  const selectedValue = normalizeCashierPaymentMethod(value);

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{label}</p> : null}
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
        {CASHIER_PAYMENT_METHOD_OPTIONS.map((option) => {
          const isActive = option.value === selectedValue;
          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                'rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
                disabled && 'cursor-not-allowed opacity-60',
                buttonClassName,
              )}
              disabled={disabled}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {hiddenInputName ? <input type="hidden" name={hiddenInputName} value={selectedValue} /> : null}
    </div>
  );
}
