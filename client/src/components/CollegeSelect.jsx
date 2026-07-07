import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Building, ChevronDown, Loader2, Search } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const CollegeSelect = ({ value = '', onChange, disabled = false, placeholder = 'Search or select your college' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/meta/colleges`, {
          params: { q: query, limit: 25 },
          signal: controller.signal
        });
        if (res.data.success) {
          setOptions(res.data.data || []);
        }
      } catch (err) {
        if (err?.code !== 'ERR_CANCELED') {
          setOptions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const selectCollege = (name) => {
    onChange({ target: { name: 'collegeName', value: name } });
    setQuery(name);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Building className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange({ target: { name: 'collegeName', value: e.target.value } });
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border-2 border-transparent bg-slate-50 py-3.5 pl-11 pr-10 outline-none transition-all focus:border-indigo-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label="Toggle college list"
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {open && !disabled && (
        <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900">
          <div className="sticky top-0 flex items-center gap-2 border-b border-slate-100 bg-white px-3 py-2 text-xs text-slate-500 dark:border-white/10 dark:bg-slate-900">
            <Search size={14} />
            Type to search 200+ Indian colleges and universities
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" /> Searching...
            </div>
          ) : options.length > 0 ? (
            options.map((college) => (
              <button
                key={college}
                type="button"
                onClick={() => selectCollege(college)}
                className={`block w-full px-4 py-3 text-left text-sm transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10 ${
                  value === college ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {college}
              </button>
            ))
          ) : (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No matches found. You can still use your typed college name.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CollegeSelect;
