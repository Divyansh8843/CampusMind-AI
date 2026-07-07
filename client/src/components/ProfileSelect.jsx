import React from 'react';

const ProfileSelect = ({
  label,
  name,
  value = '',
  onChange,
  options = [],
  disabled = false,
  required = false,
  placeholder = 'Select an option',
  icon: Icon
}) => (
  <div className="group">
    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
      {Icon && <Icon size={18} className="text-indigo-500" />}
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      className="w-full cursor-pointer rounded-xl border-2 border-transparent bg-slate-50 px-4 py-3.5 outline-none transition-all focus:border-indigo-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

export default ProfileSelect;
