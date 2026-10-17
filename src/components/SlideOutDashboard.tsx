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
  Clock,
  Tag,
  AlertCircle,
  Activity,
} from 'lucide-react';
import {
  JarvisDataStore,
  CalendarEvent,
  TaskItem,
  ProjectItem,
  ReminderItem,
} from '../types';
import {
  addCalendarEvent,
  deleteCalendarEvent,
  addTask,
  toggleTask,
  deleteTask,
  addProject,
  updateProjectProgress,
  deleteProject,
  addReminder,
  deleteReminder,
} from '../services/api';

interface SlideOutDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  data: JarvisDataStore;
  onRefreshData: () => Promise<void>;
}

type TabType = 'home' | 'calendar' | 'tasks' | 'projects' | 'reminders';

export const SlideOutDashboard: React.FC<SlideOutDashboardProps> = ({
  isOpen,
  onClose,
  data,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');

  // Form States for adding items
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventTime, setNewEventTime] = useState('14:00');
  const [newEventCategory, setNewEventCategory] = useState('Armor Protocol');

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

  // Calendar handlers
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    setIsSubmitting(true);
    await addCalendarEvent({
      title: newEventTitle,
      date: newEventDate,
      time: newEventTime,
      category: newEventCategory,
    });
    setNewEventTitle('');
    setShowEventForm(false);
    setIsSubmitting(false);
    await onRefreshData();
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteCalendarEvent(id);
    await onRefreshData();
  };

  // Task handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsSubmitting(true);
    await addTask({
      title: newTaskTitle,
      priority: newTaskPriority,
      category: newTaskCategory,
      dueDate: 'Today',
    });
    setNewTaskTitle('');
    setShowTaskForm(false);
    setIsSubmitting(false);
    await onRefreshData();
  };

  const handleToggleTask = async (id: string) => {
    await toggleTask(id);
    await onRefreshData();
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    await onRefreshData();
  };

  // Project handlers
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    setIsSubmitting(true);
    await addProject({
      title: newProjectTitle,
      description: newProjectDesc,
      progress: newProjectProgress,
      tag: newProjectTag,
      status: 'active',
    });
    setNewProjectTitle('');
    setNewProjectDesc('');
    setShowProjectForm(false);
    setIsSubmitting(false);
    await onRefreshData();
  };

  const handleProgressChange = async (id: string, progress: number) => {
    await updateProjectProgress(id, progress);
    await onRefreshData();
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    await onRefreshData();
  };

  // Reminder handlers
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText.trim()) return;
    setIsSubmitting(true);
    await addReminder({
      text: newReminderText,
      time: newReminderTime,
      priority: newReminderPriority,
    });
    setNewReminderText('');
    setShowReminderForm(false);
    setIsSubmitting(false);
    await onRefreshData();
  };

  const handleDeleteReminder = async (id: string) => {
    await deleteReminder(id);
    await onRefreshData();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* DASHBOARD DRAWER PANEL */}
      <aside className="w-full max-w-xl h-full bg-[#020814]/95 border-l border-cyan-500/40 shadow-[-10px_0_35px_rgba(0,240,255,0.2)] flex flex-col overflow-hidden relative font-['Rajdhani',sans-serif]">
        {/* Subtle holographic grid lines */}
        <div className="absolute inset-0 hud-grid-bg opacity-20 pointer-events-none" />

        {/* DRAWER HEADER */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-[#031024]/80">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            <div>
              <h2 className="font-['Orbitron',sans-serif] text-base font-bold tracking-wider text-cyan-200">
                J.A.R.V.I.S. MISSION CONTROL
              </h2>
              <span className="text-[11px] font-mono text-cyan-400/60 uppercase tracking-widest">
                STARK PROTOCOL LEVEL 5 CLEARANCE
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-200 transition-colors cursor-pointer"
            title="Close Dashboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 MANDATORY NAVIGATION TABS: Home, Calendar, To-do List, Work/Projects, Reminders */}
        <nav className="relative z-10 flex items-center border-b border-cyan-500/30 bg-[#020c1c]/90 px-2 py-1.5 overflow-x-auto gap-1">
          <button
            onClick={() => {
              setActiveTab('home');
              onClose();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'home'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'text-cyan-400/70 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>HOME</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
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
        </nav>

        {/* TAB CONTENTS (Scrollable) */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================= */}
          {/* 1. CALENDAR TAB */}
          {/* ========================================================= */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-cyan-200 tracking-wide">Tactical Schedule & Events</h3>
                  <p className="text-xs text-cyan-400/60 font-mono">Synchronized with J.A.R.V.I.S. voice executive</p>
                </div>
                <button
                  onClick={() => setShowEventForm(!showEventForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-mono rounded-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showEventForm ? 'CANCEL' : 'ADD EVENT'}</span>
                </button>
              </div>

              {/* Add Event Form */}
              {showEventForm && (
                <form
                  onSubmit={handleCreateEvent}
                  className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-sm space-y-3"
                >
                  <div>
                    <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">EVENT TITLE</label>
                    <input
                      type="text"
                      required
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="e.g. Flight Test Mark 85 Supersonic Thrusters"
                      className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">DATE</label>
                      <input
                        type="date"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">TIME</label>
                      <input
                        type="time"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">CATEGORY</label>
                    <select
                      value={newEventCategory}
                      onChange={(e) => setNewEventCategory(e.target.value)}
                      className="w-full bg-[#010c1c] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400"
                    >
                      <option value="Armor Protocol">Armor Protocol</option>
                      <option value="Corporate">Corporate / Stark Board</option>
                      <option value="Defense">Avengers / Defense</option>
                      <option value="Workshop">Workshop & Engineering</option>
                      <option value="Personal">Personal</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs tracking-wider rounded-xs transition-colors cursor-pointer"
                  >
                    CONFIRM & SCHEDULE
                  </button>
                </form>
              )}

              {/* Event Cards */}
              <div className="space-y-3">
                {data.calendar.length === 0 ? (
                  <div className="text-center py-8 text-cyan-500/50 font-mono text-sm">
                    NO SCHEDULED PROTOCOLS IN QUEUE.
                  </div>
                ) : (
                  data.calendar.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 bg-[#020e20] border border-cyan-500/30 hover:border-cyan-400/60 rounded-xs flex items-start justify-between gap-3 transition-colors group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950 border border-cyan-400/30 text-cyan-300 rounded-xs">
                            {ev.category}
                          </span>
                          <span className="text-xs font-mono text-cyan-400/70 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {ev.date} @ {ev.time} ({ev.duration || '60 mins'})
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-cyan-100">{ev.title}</h4>
                        {ev.notes && <p className="text-xs text-cyan-400/70 mt-1">{ev.notes}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="text-cyan-500/50 hover:text-red-400 transition-colors p-1 cursor-pointer"
                        title="Cancel Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. TO-DO LIST TAB */}
          {/* ========================================================= */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-cyan-200 tracking-wide">Directives & To-Do List</h3>
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
                {data.tasks.length === 0 ? (
                  <div className="text-center py-8 text-cyan-500/50 font-mono text-sm">
                    ALL WORKSHOP DIRECTIVES COMPLETE.
                  </div>
                ) : (
                  data.tasks.map((task) => (
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
                              task.completed
                                ? 'line-through text-cyan-500/50'
                                : 'text-cyan-100 font-semibold'
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
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. WORK / PROJECTS TAB */}
          {/* ========================================================= */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-cyan-200 tracking-wide">Stark Industries Initiatives</h3>
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

                    {/* Progress Metric Bar */}
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
          {/* 4. REMINDERS TAB */}
          {/* ========================================================= */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-cyan-200 tracking-wide">Active Neural Alerts</h3>
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
                {data.reminders.length === 0 ? (
                  <div className="text-center py-8 text-cyan-500/50 font-mono text-sm">
                    NO ACTIVE ALERTS ARMED.
                  </div>
                ) : (
                  data.reminders.map((rem) => (
                    <div
                      key={rem.id}
                      className={`p-3.5 bg-[#020e20] border rounded-xs flex items-center justify-between gap-3 transition-colors ${
                        rem.priority === 'high'
                          ? 'border-red-500/40 bg-red-950/15'
                          : 'border-cyan-500/30 hover:border-cyan-400/60'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <AlertCircle
                          className={`w-4 h-4 mt-0.5 ${
                            rem.priority === 'high' ? 'text-red-400 animate-pulse' : 'text-cyan-400'
                          }`}
                        />
                        <div>
                          <div className="text-sm font-semibold text-cyan-100">{rem.text}</div>
                          <div className="text-xs font-mono text-cyan-400/60 mt-0.5">
                            Trigger: {rem.time}
                          </div>
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
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* DRAWER FOOTER */}
        <div className="relative z-10 px-6 py-3 border-t border-cyan-500/30 bg-[#020814]/90 flex items-center justify-between text-xs font-mono text-cyan-400/60">
          <span>ARC REACTOR TELEMETRY: NOMINAL</span>
          <span className="text-cyan-300">STARK INDUSTRIES OS</span>
        </div>
      </aside>
    </div>
  );
};
