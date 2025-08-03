import React from 'react';
import { useForm } from 'react-hook-form';
import { X, DollarSign } from 'lucide-react';
import type { CreateAccountRequest, Account } from '../../../shared/types';

interface AccountFormProps {
  account?: Account;
  onSubmit: (data: CreateAccountRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'investment', label: 'Investment Account' },
  { value: 'cash', label: 'Cash' }
] as const;

const ACCOUNT_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#ec4899', // Pink
  '#6b7280'  // Gray
];

const ACCOUNT_ICONS = [
  'wallet',
  'credit-card',
  'banknote',
  'trending-up',
  'dollar-sign',
  'piggy-bank',
  'building-2',
  'coins'
];

export const AccountForm: React.FC<AccountFormProps> = ({
  account,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateAccountRequest>({
    defaultValues: account ? {
      name: account.name,
      type: account.type,
      balance: account.balance,
      color: account.color,
      icon: account.icon
    } : {
      type: 'checking',
      balance: 0,
      color: '#3b82f6',
      icon: 'wallet'
    }
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  const handleFormSubmit = (data: CreateAccountRequest) => {
    onSubmit({
      ...data,
      balance: parseFloat(data.balance.toString())
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {account ? 'Edit Account' : 'Add Account'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name
            </label>
            <input
              type="text"
              {...register('name', { required: 'Account name is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Chase Checking"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <select
              {...register('type', { required: 'Account type is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ACCOUNT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Balance
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                step="0.01"
                {...register('balance', { 
                  required: 'Balance is required',
                  valueAsNumber: true
                })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            {errors.balance && (
              <p className="mt-1 text-sm text-red-600">{errors.balance.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ACCOUNT_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setValue('icon', icon)}
                  className={`p-3 rounded-lg border-2 text-gray-600 hover:bg-gray-50 transition-colors ${
                    selectedIcon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <div className="w-6 h-6 mx-auto">
                    {/* For now, just show the icon name. In a real app, you'd render the actual icon */}
                    <span className="text-xs">{icon}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              {account ? 'Update' : 'Add'} Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};