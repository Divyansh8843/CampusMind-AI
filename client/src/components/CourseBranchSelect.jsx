import React from 'react';
import { Book } from 'lucide-react';
import { COURSE_BRANCH_OPTIONS, getCourseBranchLabel } from '../data/academicOptions';

const CourseBranchSelect = ({
  course = '',
  branch = '',
  onChange,
  disabled = false,
  required = false,
  label = 'Course & Branch'
}) => {
  const selectedLabel = getCourseBranchLabel(course, branch);

  const handleSelect = (e) => {
    const option = COURSE_BRANCH_OPTIONS.find((item) => item.label === e.target.value);
    if (option) {
      onChange({ course: option.course, branch: option.branch });
    } else {
      onChange({ course: '', branch: '' });
    }
  };

  const grouped = COURSE_BRANCH_OPTIONS.reduce((acc, item) => {
    if (!acc[item.course]) acc[item.course] = [];
    acc[item.course].push(item);
    return acc;
  }, {});

  return (
    <div className="group">
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <Book size={18} className="text-indigo-500" />
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={selectedLabel}
        onChange={handleSelect}
        disabled={disabled}
        className="w-full cursor-pointer rounded-xl border-2 border-transparent bg-slate-50 px-4 py-3.5 outline-none transition-all focus:border-indigo-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
      >
        <option value="">Select Course & Branch</option>
        {Object.entries(grouped).map(([courseName, items]) => (
          <optgroup key={courseName} label={courseName}>
            {items.map((item) => (
              <option key={item.label} value={item.label}>
                {item.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {selectedLabel && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Selected: <span className="font-medium text-slate-700 dark:text-slate-200">{selectedLabel}</span>
        </p>
      )}
    </div>
  );
};

export default CourseBranchSelect;
