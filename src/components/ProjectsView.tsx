import React, { useState } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import { Project } from '../types.ts';
import {
  FolderKanban,
  Plus,
  Trash2,
  Edit3,
  Check,
  MessageSquare,
  Sparkles,
  ArrowRight,
  BookOpen,
  Settings,
  Layers,
  FileText,
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    createProject,
    updateProject,
    deleteProject,
    newChat,
    setWorkspaceTab,
    conversations,
    selectConversation,
  } = useChat();

  const [isCreating, setIsCreating] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setInstructions('');
    setNotes('');
    setIsCreating(false);
    setEditingProjectId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createProject({
      name: name.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      notes: notes.trim(),
    });
    resetForm();
  };

  const startEdit = (proj: Project) => {
    setEditingProjectId(proj.id);
    setName(proj.name);
    setDescription(proj.description || '');
    setInstructions(proj.instructions || '');
    setNotes(proj.notes || '');
    setIsCreating(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectId || !name.trim()) return;
    await updateProject(editingProjectId, {
      name: name.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      notes: notes.trim(),
    });
    resetForm();
  };

  const handleStartChatInProject = (projId: string) => {
    setActiveProjectId(projId);
    newChat('normal');
    setWorkspaceTab('chat');
  };

  return (
    <div className="flex flex-col flex-1 h-full min-w-0 bg-slate-50 dark:bg-[#080A12] overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#0B0E19] border border-slate-200 dark:border-[#1E2337] p-5 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-blue-500 flex items-center justify-center text-white shadow-md">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-[#F5F7FF]">
              Projects Engine
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Isolate custom instructions, context, files, and chats for each task or client
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsCreating(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all shadow-md shadow-[#7C3AED]/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Create / Edit Form Modal or Card */}
      {(isCreating || editingProjectId) && (
        <form
          onSubmit={editingProjectId ? handleUpdate : handleCreate}
          className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0B0E19] border border-[#7C3AED]/50 shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2337]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {editingProjectId ? 'Edit Project' : 'Create New Project'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AI Thesis, Mobile App Redesign, Python ETL"
                className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#121629] border border-slate-200 dark:border-[#20263F] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Short Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief objective or focus of this project..."
                className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#121629] border border-slate-200 dark:border-[#20263F] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>Custom System Instructions for this Project</span>
              <span className="text-[11px] text-[#06B6D4] font-normal">
                Always injected into Gemini prompts
              </span>
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="e.g. You are the senior technical lead. Always write clean TypeScript code with comments. Target Python 3.11 with FastAPI."
              className="w-full mt-1.5 p-3 text-xs rounded-xl bg-slate-50 dark:bg-[#121629] border border-slate-200 dark:border-[#20263F] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Project Notes & Scratchpad
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Key links, requirements, meeting notes..."
              className="w-full mt-1.5 p-3 text-xs rounded-xl bg-slate-50 dark:bg-[#121629] border border-slate-200 dark:border-[#20263F] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs rounded-xl text-slate-500 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-md cursor-pointer"
            >
              {editingProjectId ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-slate-400">
            <FolderKanban className="w-14 h-14 stroke-[1.5] mb-3 opacity-40 text-[#7C3AED]" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
              No projects created yet
            </p>
            <p className="text-xs max-w-sm mt-1">
              Create your first project to organize chats, maintain tailored system instructions, and keep files isolated.
            </p>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-[#7C3AED] text-white font-bold text-xs shadow-md cursor-pointer"
            >
              Create Project
            </button>
          </div>
        ) : (
          projects.map((proj) => {
            const isActive = activeProjectId === proj.id;
            const projectChats = conversations.filter(
              (c) => c.projectId === proj.id || (proj.conversationIds && proj.conversationIds.includes(c.id))
            );

            return (
              <div
                key={proj.id}
                className={`p-5 rounded-3xl bg-white dark:bg-[#0B0E19] border transition-all flex flex-col justify-between shadow-xs ${
                  isActive
                    ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/30'
                    : 'border-slate-200 dark:border-[#1E2337] hover:border-[#7C3AED]/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          isActive ? 'bg-[#06B6D4] animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {isActive ? 'Active Project' : 'Project'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(proj)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProject(proj.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {proj.name}
                  </h3>
                  {proj.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {proj.description}
                    </p>
                  )}

                  {proj.instructions && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121629] border border-slate-100 dark:border-[#1C2138] text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                      <span className="font-semibold text-[#06B6D4]">Prompt: </span>
                      {proj.instructions}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mb-4">
                    <MessageSquare className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>{projectChats.length} Conversations linked</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#1A1F36] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveProjectId(isActive ? null : proj.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-slate-200 dark:bg-[#1E2337] text-slate-700 dark:text-slate-300'
                        : 'bg-slate-100 dark:bg-[#121629] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1C2138]'
                    }`}
                  >
                    {isActive ? 'Deactivate' : 'Set as Active'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartChatInProject(proj.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <span>Open Chat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
