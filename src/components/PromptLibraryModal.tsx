import React, { useState, useMemo } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { PROMPT_LIBRARY } from '../data/promptLibrary.ts';
import { PromptCategory, PromptItem } from '../types.ts';
import {
  Search,
  X,
  Sparkles,
  BookOpen,
  Code2,
  PenTool,
  CheckCircle,
  Compass,
  FileSearch,
  Briefcase,
  Star,
  Copy,
  ArrowRight,
} from 'lucide-react';

interface PromptLibraryModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectPrompt?: (text: string) => void;
}

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onSelectPrompt: propOnSelectPrompt,
}) => {
  const { isPromptLibraryOpen, setIsPromptLibraryOpen, sendMessage } = useChat();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isPromptLibraryOpen;
  const onClose = propOnClose || (() => setIsPromptLibraryOpen(false));
  const onSelectPrompt =
    propOnSelectPrompt ||
    ((text: string) => {
      sendMessage(text);
      setIsPromptLibraryOpen(false);
    });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('openspace_favorite_prompts') || localStorage.getItem('myai_favorite_prompts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const categories: { id: PromptCategory | 'all'; label: string; icon: React.FC<any> }[] = [
    { id: 'all', label: 'All Prompts', icon: Compass },
    { id: 'study', label: 'Study & Learn', icon: BookOpen },
    { id: 'coding', label: 'Coding & Dev', icon: Code2 },
    { id: 'writing', label: 'Writing & Creative', icon: PenTool },
    { id: 'productivity', label: 'Productivity', icon: CheckCircle },
    { id: 'research', label: 'Research & Deep Dive', icon: Search },
    { id: 'data_analysis', label: 'Data & Analytics', icon: FileSearch },
    { id: 'career', label: 'Career & Growth', icon: Briefcase },
  ];

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem('openspace_favorite_prompts', JSON.stringify(updated));
  };

  const filteredPrompts = useMemo(() => {
    return PROMPT_LIBRARY.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.prompt.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  const handleCopy = (prompt: PromptItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.prompt);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleUsePrompt = (promptText: string) => {
    onSelectPrompt(promptText);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white dark:bg-[#0B0E19] border border-slate-200 dark:border-[#1E2337] rounded-3xl text-slate-900 dark:text-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-[#1E2337] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">OpenSpace AI Prompt Library</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Curated high-performance prompts for study, coding, writing & research
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

        {/* Search & Category Filter Bar */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-[#080A12] border-b border-slate-200 dark:border-[#1E2337] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts by keyword, task, or topic..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#121629] border border-slate-200 dark:border-[#20263F] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#7C3AED]"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(({ id, label, icon: Icon }) => {
              const active = selectedCategory === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedCategory(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'bg-white dark:bg-[#121629] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1A2038] border border-slate-200 dark:border-[#20263F]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompts Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredPrompts.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <Compass className="w-12 h-12 stroke-[1.5] mb-3 opacity-50" />
              <p className="text-base font-semibold">No matching prompts found</p>
              <p className="text-xs mt-1">Try another search keyword or select All Prompts</p>
            </div>
          ) : (
            filteredPrompts.map((item) => {
              const isFav = favorites.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleUsePrompt(item.prompt)}
                  className="group p-4 rounded-2xl bg-white dark:bg-[#101424] border border-slate-200 dark:border-[#1E2337] hover:border-[#7C3AED]/50 hover:shadow-lg dark:hover:shadow-[#7C3AED]/10 transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#06B6D4]">
                        {item.category.replace('_', ' ')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(item.id, e)}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isFav ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'
                        }`}
                        title={isFav ? 'Remove favorite' : 'Add favorite'}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-[#F5F7FF] mb-1 group-hover:text-[#7C3AED] dark:group-hover:text-[#06B6D4] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {item.description || item.prompt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#1A1F36] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => handleCopy(item, e)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedId === item.id ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <div className="flex items-center gap-1 text-xs font-semibold text-[#7C3AED] dark:text-[#06B6D4] group-hover:translate-x-1 transition-transform">
                      <span>Use Prompt</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
