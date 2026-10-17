import React, { useState } from 'react';
import { Brain, Plus, Trash2, Search, Sparkles, Shield, Clock, Tag } from 'lucide-react';
import { MemoryItem } from '../types';
import { addMemory, deleteMemory } from '../services/api';
import { useAuth } from '../firebase/AuthContext';
import { addFirestoreMemory, deleteFirestoreMemory } from '../firebase/firestoreService';

interface MemoryBanksViewProps {
  memories: MemoryItem[];
  onRefresh: () => Promise<void>;
}

export const MemoryBanksView: React.FC<MemoryBanksViewProps> = ({ memories, onRefresh }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'project' | 'preference' | 'personal' | 'general' | 'deadline'>('project');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredMemories = memories.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.content.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
  });

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setIsSubmitting(true);

    const memItem: MemoryItem = {
      id: `mem-${Date.now()}`,
      content: newContent.trim(),
      category: newCategory,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (user) {
      await addFirestoreMemory(user.uid, memItem).catch(console.error);
    }
    await addMemory(newContent.trim(), newCategory).catch(() => {});

    setNewContent('');
    setShowAddForm(false);
    setIsSubmitting(false);
    await onRefresh();
  };

  const handleDeleteMemory = async (id: string) => {
    if (user) {
      await deleteFirestoreMemory(user.uid, id).catch(console.error);
    }
    await deleteMemory(id).catch(() => {});
    await onRefresh();
  };

  const categoryColors: Record<string, string> = {
    deadline: 'bg-red-500/20 text-red-300 border-red-500/40',
    preference: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    project: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    personal: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    general: 'bg-slate-700 text-slate-300 border-slate-600',
  };

  return (
    <div className="space-y-4">
      {/* Header & Description */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-cyan-200 tracking-wide font-mono">
              Core Memory Banks
            </h3>
          </div>
          <p className="text-xs text-cyan-400/60 font-mono mt-0.5">
            Real, persistent long-term knowledge recalled automatically during conversations
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-mono rounded-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'CANCEL' : 'ENCODE MEMORY'}</span>
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xs flex items-start gap-2.5 text-xs font-mono text-cyan-300/80">
        <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          Memories are user-specific and persisted across sessions. Ask JARVIS verbally to{' '}
          <span className="text-cyan-200 font-bold">&ldquo;Remember that...&rdquo;</span> or{' '}
          <span className="text-cyan-200 font-bold">&ldquo;Forget...&rdquo;</span> to update these records.
        </p>
      </div>

      {/* Add Memory Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMemory}
          className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-sm space-y-3"
        >
          <div>
            <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">
              MEMORY DIRECTIVE OR FACT
            </label>
            <input
              type="text"
              required
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. Project ARCHITECT deadline is November 10, 2026"
              className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400 font-sans"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">CATEGORY</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-xs px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400 font-mono"
              >
                <option value="project">Project Detail</option>
                <option value="deadline">Deadline</option>
                <option value="preference">User Preference</option>
                <option value="personal">Personal Fact</option>
                <option value="general">General</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs tracking-wider rounded-xs transition-colors cursor-pointer"
            >
              COMMIT TO MEMORY
            </button>
          </div>
        </form>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-cyan-400/50" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter memories by keyword or tag..."
          className="w-full bg-[#010814] border border-cyan-500/30 focus:border-cyan-400 text-xs text-cyan-200 placeholder-cyan-500/40 rounded-xs pl-8 pr-3 py-2 font-mono focus:outline-hidden"
        />
      </div>

      {/* Memories List */}
      <div className="space-y-2.5">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-8 text-cyan-500/50 font-mono text-sm">
            NO MEMORIES FOUND MATCHING CRITERIA.
          </div>
        ) : (
          filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="p-3.5 bg-[#020e20] border border-cyan-500/30 hover:border-cyan-400/60 rounded-xs flex items-start justify-between gap-3 transition-colors group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 border rounded-xs uppercase font-bold ${
                      categoryColors[mem.category] || categoryColors.general
                    }`}
                  >
                    {mem.category}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-500/60 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Recorded: {new Date(mem.created_at || mem.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-cyan-100 font-sans">{mem.content}</p>
              </div>

              <button
                onClick={() => handleDeleteMemory(mem.id)}
                className="text-cyan-500/40 hover:text-red-400 transition-colors p-1 cursor-pointer font-mono text-xs flex items-center gap-1"
                title="Purge Memory"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline text-[10px]">FORGET</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
