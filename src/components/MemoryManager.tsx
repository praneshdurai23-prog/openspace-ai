import React, { useState } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { Brain, Plus, Trash2, X, Shield, Sparkles, Tag } from 'lucide-react';

interface MemoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryManager: React.FC<MemoryManagerProps> = ({ isOpen, onClose }) => {
  const { memories, addMemory, deleteMemory, clearAllMemories } = useChat();

  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [isAdding, setIsAdding] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    await addMemory(newFact.trim(), newCategory);
    setNewFact('');
    setIsAdding(false);
  };

  const handleClear = async () => {
    await clearAllMemories();
    setConfirmClear(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#0B0E19] border border-slate-200 dark:border-[#1E2337] rounded-3xl text-slate-900 dark:text-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-[#1E2337] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-white shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Smart Memory</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Key preferences and context OpenSpace AI remembers across conversations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy & Control Banner */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#080A12] border-b border-slate-200 dark:border-[#1E2337] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Shield className="w-4 h-4 text-[#06B6D4]" />
            <span>Memories are stored in your private workspace. You have complete control.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Memory</span>
            </button>

            {memories.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Add Memory Form */}
        {isAdding && (
          <form onSubmit={handleAdd} className="p-4 bg-slate-100 dark:bg-[#121629] border-b border-slate-200 dark:border-[#1E2337] space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                What should OpenSpace AI remember about you or your work?
              </label>
              <textarea
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                placeholder="e.g. I prefer TypeScript and clean functional React. Explain complex concepts with analogies."
                rows={2}
                className="w-full mt-1.5 p-2.5 rounded-xl bg-white dark:bg-[#0B0E19] border border-slate-300 dark:border-[#20263F] text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Category:</span>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-[#0B0E19] border border-slate-300 dark:border-[#20263F] text-slate-700 dark:text-slate-200"
                >
                  <option value="general">General</option>
                  <option value="preferences">Preferences</option>
                  <option value="coding">Coding & Tech</option>
                  <option value="work">Work & Career</option>
                  <option value="study">Study & Learning</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFact.trim()}
                  className="px-4 py-1.5 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-slate-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Save Fact
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Clear confirmation modal alert */}
        {confirmClear && (
          <div className="p-4 bg-rose-500/15 border-b border-rose-500/30 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold text-rose-500 dark:text-rose-400">
              Are you sure you want to permanently erase all memories?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1 rounded-lg text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1 rounded-lg text-xs bg-rose-600 text-white font-bold cursor-pointer"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        )}

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <Brain className="w-12 h-12 stroke-[1.5] mb-3 opacity-40 text-[#7C3AED]" />
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                No memories stored yet
              </p>
              <p className="text-xs max-w-sm mt-1">
                OpenSpace AI automatically learns key preferences from your conversations, or you can add custom facts using the "Add Memory" button above.
              </p>
            </div>
          ) : (
            memories.map((mem) => (
              <div
                key={mem.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#121629] border border-slate-200 dark:border-[#1E2337] flex items-start justify-between gap-3 group hover:border-[#7C3AED]/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4]">
                      {mem.category || 'general'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(mem.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                    {mem.content}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => deleteMemory(mem.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Delete memory"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
