import React, { useState } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  CheckSquare,
  Briefcase,
  Bell,
  Home,
  Plus,
  Trash2,
  CheckCircle2,
  Brain,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { JarvisDataStore } from '../types';
import {
  addTask,
  toggleTask,
  deleteTask,
  addProject,
  updateProjectProgress,
  deleteProject,
  addReminder,
  deleteReminder,
} from '../services/api';
import { useAuth } from '../firebase/AuthContext';
import {
  addFirestoreTask,
  toggleFirestoreTask,
  deleteFirestoreTask,
  addFirestoreProject,
  deleteFirestoreProject,
  addFirestoreReminder,
  deleteFirestoreReminder,
} from '../firebase/firestoreService';
import { CalendarView } from './CalendarView';
import { MemoryBanksView } from './MemoryBanksView';

interface SlideOutDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  data: JarvisDataStore;
  onRefreshData: () => Promise<void>;
}

type TabType = 'home' | 'calendar' | 'tasks' | 'projects' | 'reminders' | 'memory';

export const SlideOutDashboard: React.FC<SlideOutDashboardProps> = ({
  isOpen,
  onClose,
  data,
  onRefreshData,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Form States for adding items
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('Engineering');

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectProgress, setNewProjectProgress] = useState(15);
  const [newProjectTag, setNewProjectTag] = useState('Workshop');

  const [showReminderForm, setShowReminderForm] = useState(false);
  const [newReminderText, setNewReminderText] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('Today 17:00');
  const [newReminderPriority, setNewReminderPriority] = useState<'normal' | 'high'>('high');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Task handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsSubmitting(true);

    const taskPayload = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      priority: newTaskPriority,
      category: newTaskCategory,
      completed: false,
      dueDate: 'Today',
      created_at: new Date().toISOString(),
    };

    if (user) {
      await addFirestoreTask(user.uid, taskPayload).catch(console.error);
    }
    await addTask(taskPayload).catch(() => {});

    setNewTaskTitle('');
    setShowTaskForm(false);
    setIsSubmitting(false);
    await onRefreshData();
  };

  const handleToggleTask = async (id: string) => {
    const task = data.tasks.find((t) => t.id === id);
    if (user && task) {
      await toggleFirestoreTask(user.uid, id, task.completed).catch(console.error);
    }
    await toggleTask(id).catch(() => {});
    await onRefreshData();
  };

  const handleDeleteTask = async (id: string) => {
    if (user) {
      await deleteFirestoreTask(user.uid, id).catch(console.error);
    }
    await deleteTask(id).catch(() => {});
    await onRefreshData();
  };

  // Project handlers
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    setIsSubmitting(true);

    const projPayload = {
      id: `proj-${Date.now()}`,
      title: newProjectTitle,
      description: newProjectDesc,
      progress: newProjectProgress,
      tag: newProjectTag,
      status: 'active' as const,
      updated_at: new Date().toISOString(),
    };

    if (user) {
      await addFirestoreProject(user.uid, projPayload).catch(console.error);
    }
    await addProject(projPayload).catch(() => {});

    setNewProjectTitle('');
    setNewProjectDesc('');
    setShowProjectForm(false);
    setIsSubmitting(false);
    await onRefreshData();
  };

  const handleProgressChange = async (id: string, progress: number) => {
    await updateProjectProgress(id, progress).catch(() => {});
    await onRefreshData();
  };

  const handleDeleteProject = async (id: string) => {
    if (user) {
      await deleteFirestoreProject(user.uid, id).catch(console.error);
    }
    await deleteProject(id).catch(() => {});
    await onRefreshData();
  };

  // Reminder handlers
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText.trim()) return;
    setIsSubmitting(true);

    const remPayload = {
      id: `rem-${Date.now()}`,
      text: newReminderText,
      time: newReminderTime,
      priority: newReminderPriority,
      dismissed: false,
      created_at: new Date().toISOString(),
    };

    if (user) {
      await addFirestoreReminder(user.uid, remPayload).catch(console.error);
    }
    await addReminder(remPayload).catch(() => {});

    setNewReminderText('');
    setShowReminderForm(false);
    setIsSubmitting(false);
    await onRefreshData();
  };

  const handleDeleteReminder = async (id: string) => {
    if (user) {
      await deleteFirestoreReminder(user.uid, id).catch(console.error);
    }
    await deleteReminder(id).catch(() => {});
    await onRefreshData();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* DASHBOARD DRAWER PANEL */}
      <aside
        className={`h-full bg-[#020814]/98 border-l border-cyan-500/40 shadow-[-15px_0_45px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden relative font-['Rajdhani',sans-serif] transition-all duration-300 ${
          isExpanded || activeTab === 'calendar' ? 'w-full lg:w-[94vw]' : 'w-full max-w-2xl'
        }`}
      >
        {/* Subtle holographic grid lines */}
        <div className="absolute inset-0 hud-grid-bg opacity-20 pointer-events-none" />

        {/* DRAWER HEADER */}
        <div className="relative z-10 flex items-center justify-between px-6 py-3.5 border-b border-cyan-500/30 bg-[#031024]/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            <div>
              <h2 className="font-['Orbitron',sans-serif] text-sm sm:text-base font-bold tracking-wider text-cyan-200">
                J.A.R.V.I.S. MISSION DASHBOARD
              </h2>
              <span className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-widest">
                STARK PROTOCOLS & CORE MEMORY BANKS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-sm border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-200 transition-colors cursor-pointer hidden sm:block"
              title={isExpanded ? 'Collapse' : 'Expand Fullscreen'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-sm border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-200 transition-colors cursor-pointer"
              title="Close Dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS: Home, Calendar, To-do List, Work/Projects, Reminders, Memory */}
        <nav className="relative z-10 flex items-center border-b border-cyan-500/30 bg-[#020c1c]/90 px-3 py-1.5 overflow-x-auto gap-1.5 shrink-0">
          <button
            onClick={() => {
              setActiveTab('home');
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap text-cyan-400/70 hover:text-cyan-200 hover:bg-cyan-950/40"
          >
            <Home className="w-3.5 h-3.5" />
            <span>HOME</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-purple-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.7)]'
                : 'text-cyan-400/70 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>CALENDAR ({data.calendar.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'text-cyan-400/70 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>TO-DO LIST ({data.tasks.filter((t) => !t.completed).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'text-cyan-400/70 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>PROJECTS ({data.projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reminders'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'text-cyan-400/70 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>REMINDERS ({data.reminders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'memory'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'text-cyan-400/70 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            <span>MEMORY BANKS ({(data.memories || []).length})</span>
          </button>
        </nav>

        {/* TAB CONTENTS (Scrollable or Full View) */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ========================================================= */}
          {/* 1. CALENDAR TAB (Full Rich Time-Grid Schedule) */}
          {/* ========================================================= */}
          {activeTab === 'calendar' && (
            <div className="h-[calc(100vh-140px)] w-full">
              <CalendarView
                events={data.calendar}
                tasks={data.tasks}
                onRefresh={onRefreshData}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. MEMORY BANKS TAB */}
          {/* ========================================================= */}
          {activeTab === 'memory' && (
            <MemoryBanksView
              memories={data.memories || []}
              onRefresh={onRefreshData}
            />
          )}

          {/* ========================================================= */}
          {/* 3. TO-DO LIST TAB */}
          {/* ========================================================= */}
          {activeTab === 'tasks' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-cyan-200 tracking-wide font-mono">
                    Directives & Tasks
                  </h3>
                  <p className="text-xs text-cyan-400/60 font-mono">Manage workshop directives and protocols</p>
                </div>
                <button
                  onClick={() => setShowTaskForm(!showTaskForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-mono rounded-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showTaskForm ? 'CANCEL' : 'ADD TASK'}</span>
                </button>
              </div>

              {/* Add Task Form */}
              {showTaskForm && (
                <form
                  onSubmit={handleCreateTask}
                  className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-sm space-y-3"
                >
                  <div>
                    <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">TASK DIRECTIVE</label>
                    <input
                      type="text"
                      required
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g. Synthesize Vibranium alloy batch #42"
                      className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">PRIORITY</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400 font-mono"
                      >
                        <option value="high">High (Crimson Priority)</option>
                        <option value="medium">Medium (Standard)</option>
                        <option value="low">Low (Auxiliary)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">CATEGORY</label>
                      <input
                        type="text"
                        value={newTaskCategory}
                        onChange={(e) => setNewTaskCategory(e.target.value)}
                        placeholder="e.g. Engineering, Workshop"
                        className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs tracking-wider rounded-xs transition-colors cursor-pointer"
                  >
                    AUTHORIZE DIRECTIVE
                  </button>
                </form>
              )}

              {/* Task Items */}
              <div className="space-y-2.5">
                {data.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 bg-[#020e20] border rounded-xs flex items-center justify-between gap-3 transition-all ${
                      task.completed
                        ? 'border-cyan-500/20 bg-[#010814]/70 opacity-60'
                        : task.priority === 'high'
                        ? 'border-red-500/40 bg-red-950/10'
                        : 'border-cyan-500/30 hover:border-cyan-400/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="cursor-pointer text-cyan-400 hover:text-cyan-200 transition-colors"
                        title={task.completed ? 'Mark pending' : 'Mark completed'}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-cyan-500/60 hover:border-cyan-400 rounded-xs" />
                        )}
                      </button>
                      <div className="flex-1">
                        <span
                          className={`text-sm ${
                            task.completed ? 'line-through text-cyan-500/50' : 'text-cyan-100 font-semibold'
                          }`}
                        >
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs uppercase ${
                              task.priority === 'high'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : task.priority === 'medium'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400/60">{task.category}</span>
                          {task.dueDate && (
                            <span className="text-[10px] font-mono text-cyan-400/50">Due: {task.dueDate}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-cyan-500/40 hover:text-red-400 transition-colors p-1 cursor-pointer"
                      title="Delete Directive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. WORK / PROJECTS TAB */}
          {/* ========================================================= */}
          {activeTab === 'projects' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-cyan-200 tracking-wide font-mono">
                    Stark Industries Initiatives
                  </h3>
                  <p className="text-xs text-cyan-400/60 font-mono">Advanced armor architectures and energy grids</p>
                </div>
                <button
                  onClick={() => setShowProjectForm(!showProjectForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-mono rounded-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showProjectForm ? 'CANCEL' : 'NEW INITIATIVE'}</span>
                </button>
              </div>

              {/* Add Project Form */}
              {showProjectForm && (
                <form
                  onSubmit={handleCreateProject}
                  className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-sm space-y-3"
                >
                  <div>
                    <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">INITIATIVE NAME</label>
                    <input
                      type="text"
                      required
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      placeholder="e.g. Project ARCHITECT: Next-Gen Armor"
                      className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">DESCRIPTION</label>
                    <textarea
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      placeholder="Summary of engineering specifications..."
                      rows={2}
                      className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">
                        INITIAL PROGRESS: {newProjectProgress}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={newProjectProgress}
                        onChange={(e) => setNewProjectProgress(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">SYSTEM TAG</label>
                      <input
                        type="text"
                        value={newProjectTag}
                        onChange={(e) => setNewProjectTag(e.target.value)}
                        placeholder="e.g. Mark LXXXV, Energy"
                        className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs tracking-wider rounded-xs transition-colors cursor-pointer"
                  >
                    DEPLOY INITIATIVE
                  </button>
                </form>
              )}

              {/* Projects List */}
              <div className="space-y-4">
                {data.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 bg-[#020e20] border border-cyan-500/30 hover:border-cyan-400/60 rounded-xs space-y-3 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950 border border-cyan-400/40 text-cyan-300">
                            {proj.tag}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400/60 uppercase">
                            STATUS: {proj.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-cyan-100">{proj.title}</h4>
                        <p className="text-xs text-cyan-400/70 mt-1">{proj.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="text-cyan-500/40 hover:text-red-400 transition-colors p-1 cursor-pointer"
                        title="Archive Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-cyan-400/80">COMPLETION STATUS</span>
                        <span className="text-cyan-300 font-bold">{proj.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-cyan-950/80 border border-cyan-500/30 rounded-xs overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_10px_rgba(0,240,255,0.8)] transition-all duration-300"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-mono text-cyan-400/60">ADJUST PROGRESS:</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={proj.progress}
                          onChange={(e) => handleProgressChange(proj.id, Number(e.target.value))}
                          className="flex-1 accent-cyan-400 h-1 bg-cyan-950 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. REMINDERS TAB */}
          {/* ========================================================= */}
          {activeTab === 'reminders' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-cyan-200 tracking-wide font-mono">
                    Active Neural Alerts
                  </h3>
                  <p className="text-xs text-cyan-400/60 font-mono">Real-time alerts broadcast via J.A.R.V.I.S.</p>
                </div>
                <button
                  onClick={() => setShowReminderForm(!showReminderForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-mono rounded-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showReminderForm ? 'CANCEL' : 'SET REMINDER'}</span>
                </button>
              </div>

              {/* Add Reminder Form */}
              {showReminderForm && (
                <form
                  onSubmit={handleCreateReminder}
                  className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-sm space-y-3"
                >
                  <div>
                    <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">REMINDER DIRECTIVE</label>
                    <input
                      type="text"
                      required
                      value={newReminderText}
                      onChange={(e) => setNewReminderText(e.target.value)}
                      placeholder="e.g. Dinner reservation with Pepper at 20:00"
                      className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">TIME / TRIGGER</label>
                      <input
                        type="text"
                        value={newReminderTime}
                        onChange={(e) => setNewReminderTime(e.target.value)}
                        placeholder="e.g. Today 20:00, In 30 mins"
                        className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">ALERT PRIORITY</label>
                      <select
                        value={newReminderPriority}
                        onChange={(e) => setNewReminderPriority(e.target.value as any)}
                        className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400 font-mono"
                      >
                        <option value="high">Urgent Alert (Red)</option>
                        <option value="normal">Standard (Cyan)</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs tracking-wider rounded-xs transition-colors cursor-pointer"
                  >
                    ARM REMINDER
                  </button>
                </form>
              )}

              {/* Reminders List */}
              <div className="space-y-3">
                {data.reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className={`p-3.5 bg-[#020e20] border rounded-xs flex items-center justify-between gap-3 transition-colors ${
                      rem.priority === 'high'
                        ? 'border-red-500/40 bg-red-950/15'
                        : 'border-cyan-500/30 hover:border-cyan-400/60'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-cyan-100">{rem.text}</div>
                      <div className="text-xs font-mono text-cyan-400/60 mt-0.5">
                        Trigger: {rem.time}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="text-cyan-500/40 hover:text-emerald-400 transition-colors p-1 cursor-pointer font-mono text-xs flex items-center gap-1"
                      title="Dismiss Alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>DISMISS</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* DRAWER FOOTER */}
        <div className="relative z-10 px-6 py-2.5 border-t border-cyan-500/30 bg-[#020814]/90 flex items-center justify-between text-xs font-mono text-cyan-400/60 shrink-0">
          <span>STARK INDUSTRIES OS // PERSISTENT MEMORY SYNCED</span>
          <span className="text-cyan-300">J.A.R.V.I.S. PROTOCOL</span>
        </div>
      </aside>
    </div>
  );
};
