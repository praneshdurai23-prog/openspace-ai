import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { AI_MODES } from '../config/modes.ts';
import { AIMode } from '../types.ts';
import { ModeIcon } from './ModeIcons.tsx';
import { ChevronDown, Check } from 'lucide-react';

export const ModeSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { currentMode, setCurrentMode, isStreaming } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentConfig = AI_MODES[currentMode] || AI_MODES.normal;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMode = (mode: AIMode) => {
    setCurrentMode(mode);
    setIsOpen(false);
  };

  return (
    <>
      {/* Desktop Segmented Pill Control with Custom Mode Icons */}
      <div className="hidden md:flex items-center bg-slate-100 dark:bg-[#171A2B] rounded-full p-1 border border-slate-200 dark:border-[#1E2337] shadow-xs">
        {(Object.keys(AI_MODES) as AIMode[]).map((modeKey) => {
          const mode = AI_MODES[modeKey];
          const isSelected = currentMode === modeKey;
          return (
            <button
              key={modeKey}
              type="button"
              disabled={isStreaming}
              onClick={() => handleSelectMode(modeKey)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/30 ring-1 ring-[#7C3AED]/50'
                  : 'text-slate-600 dark:text-[#9CA3AF] hover:text-slate-900 dark:hover:text-[#F5F7FF] hover:bg-slate-200/50 dark:hover:bg-[#1E2337]/50'
              }`}
            >
              <ModeIcon
                mode={modeKey}
                size={14}
                className={isSelected ? 'text-[#06B6D4]' : 'opacity-70'}
              />
              <span>{mode.name}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile/Compact Dropdown */}
      <div className="relative inline-block text-left md:hidden" ref={dropdownRef}>
        <button
          id="mode-selector-btn"
          type="button"
          disabled={isStreaming}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 rounded-full border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#171A2B] px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-[#F5F7FF] shadow-xs hover:bg-slate-50 dark:hover:bg-[#1E2337] transition-colors ${
            isStreaming ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
          }`}
          aria-label="Select AI Mode"
        >
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#06B6D4]">
            <ModeIcon mode={currentMode} size={13} active />
          </div>
          <span>{currentConfig.name}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 dark:border-[#1E2337] bg-white dark:bg-[#101321] p-1.5 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#1E2337] mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
                Intelligence Workflow Mode
              </p>
            </div>
            <div className="space-y-0.5">
              {(Object.keys(AI_MODES) as AIMode[]).map((modeKey) => {
                const mode = AI_MODES[modeKey];
                const isSelected = currentMode === modeKey;

                return (
                  <button
                    id={`mode-option-${modeKey}`}
                    key={modeKey}
                    type="button"
                    onClick={() => handleSelectMode(modeKey)}
                    className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#F5F7FF] font-semibold border border-[#7C3AED]/40'
                        : 'hover:bg-slate-100 dark:hover:bg-[#171A2B] text-slate-700 dark:text-[#9CA3AF]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ModeIcon
                        mode={modeKey}
                        size={15}
                        className={isSelected ? 'text-[#06B6D4]' : 'text-slate-400'}
                      />
                      <span>{mode.name}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#06B6D4]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
