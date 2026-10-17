import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Clock,
  Trash2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Filter,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { CalendarEvent, TaskItem } from '../types';
import { addCalendarEvent, deleteCalendarEvent, toggleTask } from '../services/api';
import { useAuth } from '../firebase/AuthContext';
import {
  addFirestoreCalendarEvent,
  deleteFirestoreCalendarEvent,
  toggleFirestoreTask,
} from '../firebase/firestoreService';

interface CalendarViewProps {
  events: CalendarEvent[];
  tasks: TaskItem[];
  onRefresh: () => Promise<void>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events, tasks, onRefresh }) => {
  const { user, signInWithGoogle } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [googleSyncError, setGoogleSyncError] = useState<string | null>(null);

  const handleSyncGoogleCalendar = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    setIsSyncingGoogle(true);
    setGoogleSyncError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + new Date().toISOString(), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch Google Calendar events.');
      }
      const data = await res.json();
      if (data.items) {
        for (const item of data.items) {
          if (!item.start) continue;
          const startDt = new Date(item.start.dateTime || item.start.date);
          const dateStr = startDt.toISOString().split('T')[0];
          const timeStr = startDt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          const newEvent: CalendarEvent = {
            id: `gcal-${item.id}`,
            title: item.summary || 'Google Calendar Event',
            date: dateStr,
            time: timeStr || '10:00',
            duration: '60 mins',
            category: 'Google Calendar',
            color: '#10b981',
            notes: item.description || item.location || '',
            created_at: new Date().toISOString(),
          };
          await addFirestoreCalendarEvent(user.uid, newEvent).catch(() => {});
        }
        await onRefresh();
      }
    } catch (err: any) {
      console.error('Google Calendar sync error:', err);
      setGoogleSyncError(err.message || 'Sync failed');
    } finally {
      setIsSyncingGoogle(false);
    }
  };
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month'>('week');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

  // New Event form fields
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('10:00');
  const [eventDuration, setEventDuration] = useState('60 mins');
  const [eventCategory, setEventCategory] = useState('Workshop');
  const [eventColor, setEventColor] = useState('#06b6d4');
  const [eventNotes, setEventNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active calendars toggles
  const [calGoogle, setCalGoogle] = useState(true);
  const [calApple, setCalApple] = useState(true);
  const [calOutlook, setCalOutlook] = useState(true);

  // Selected event modal
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  // Current Date logic
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Compute 7 days for the current week view
  const weekDays = useMemo(() => {
    const base = new Date();
    // Start of week (Monday)
    const dayOfWeek = base.getDay();
    const diffToMon = base.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + currentWeekOffset * 7;
    const monday = new Date(base.setDate(diffToMon));

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      return {
        date: d,
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday,
      };
    });
  }, [currentWeekOffset]);

  const monthYearStr = useMemo(() => {
    if (weekDays.length === 0) return '';
    const first = weekDays[0].date;
    return first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [weekDays]);

  // Hours displayed on the time grid (08:00 to 20:00)
  const hours = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
  ];

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ev.title.toLowerCase().includes(q) ||
          ev.category.toLowerCase().includes(q) ||
          (ev.notes && ev.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [events, searchQuery]);

  // Open Add Event modal for a specific slot
  const handleSlotClick = (dateStr: string, timeStr: string) => {
    setSelectedSlot({ date: dateStr, time: timeStr });
    setEventDate(dateStr);
    setEventTime(timeStr);
    setEventTitle('');
    setEventNotes('');
    setShowAddModal(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    setIsSubmitting(true);

    const newEvent: CalendarEvent = {
      id: `cal-${Date.now()}`,
      title: eventTitle,
      date: eventDate || weekDays[0].dateStr,
      time: eventTime,
      duration: eventDuration,
      category: eventCategory,
      color: eventColor,
      notes: eventNotes,
      created_at: new Date().toISOString(),
    };

    if (user) {
      await addFirestoreCalendarEvent(user.uid, newEvent).catch(console.error);
    }
    await addCalendarEvent(newEvent).catch(() => {});

    setIsSubmitting(false);
    setShowAddModal(false);
    await onRefresh();
  };

  const handleDeleteEvent = async (id: string) => {
    if (user) {
      await deleteFirestoreCalendarEvent(user.uid, id).catch(console.error);
    }
    await deleteCalendarEvent(id).catch(() => {});
    setActiveEvent(null);
    await onRefresh();
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-full bg-[#030712] text-cyan-200 font-['Rajdhani',sans-serif] overflow-hidden select-none border border-cyan-500/20 rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.8)]">
      {/* ------------------------------------------------------------- */}
      {/* LEFT SIDEBAR: Search, Mini-Calendar, Calendars & Tasks */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full lg:w-72 bg-[#020a16]/95 border-b lg:border-b-0 lg:border-r border-cyan-500/20 flex flex-col p-4 space-y-4 shrink-0 overflow-y-auto">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-cyan-400/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schedule or tasks..."
            className="w-full bg-[#010814] border border-cyan-500/30 focus:border-cyan-400 text-xs text-cyan-200 placeholder-cyan-500/40 rounded-sm pl-8 pr-3 py-2 font-mono focus:outline-hidden"
          />
        </div>

        {/* Mini Calendar */}
        <div className="bg-[#010814] border border-cyan-500/20 rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              {monthYearStr}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
                className="p-1 hover:bg-cyan-950 text-cyan-400 hover:text-cyan-200 rounded-xs cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
                className="p-1 hover:bg-cyan-950 text-cyan-400 hover:text-cyan-200 rounded-xs cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Day of week labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-cyan-500/60 pb-1 border-b border-cyan-500/10 mb-1.5">
            <span>S</span>
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
          </div>

          {/* Mini days grid (35 days) */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px]">
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = ((i + 1) % 31) + 1;
              const isSelectedDay = weekDays.some((w) => w.dayNumber === dayNum && w.isToday);
              return (
                <div
                  key={i}
                  className={`py-1 rounded-xs transition-colors cursor-pointer ${
                    isSelectedDay
                      ? 'bg-purple-600 text-white font-bold shadow-[0_0_8px_rgba(168,85,247,0.7)]'
                      : i >= 5 && i <= 31
                      ? 'text-cyan-200 hover:bg-cyan-950/60'
                      : 'text-cyan-600/40'
                  }`}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>
        </div>

        {/* My Calendars list with toggles */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono tracking-wider text-cyan-400/80 uppercase font-semibold">
            My Calendars
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex flex-col gap-1 p-1.5 rounded-xs bg-cyan-950/20 border border-cyan-500/20">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-cyan-200 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Google Calendar
                </span>
                <input
                  type="checkbox"
                  checked={calGoogle}
                  onChange={() => setCalGoogle(!calGoogle)}
                  className="accent-purple-500 cursor-pointer"
                />
              </div>
              <button
                onClick={handleSyncGoogleCalendar}
                disabled={isSyncingGoogle}
                className="w-full mt-1 px-2 py-1 bg-cyan-900/60 hover:bg-cyan-800/80 text-cyan-200 text-[11px] font-mono rounded-xs border border-cyan-500/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 text-cyan-300" />
                {isSyncingGoogle ? 'Syncing...' : 'Sync Google Calendar'}
              </button>
              {googleSyncError && (
                <span className="text-[10px] text-red-400 font-mono mt-0.5">{googleSyncError}</span>
              )}
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-xs hover:bg-cyan-950/40">
              <span className="flex items-center gap-2 text-cyan-200">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                Apple Calendar
              </span>
              <input
                type="checkbox"
                checked={calApple}
                onChange={() => setCalApple(!calApple)}
                className="accent-purple-500 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-xs hover:bg-cyan-950/40">
              <span className="flex items-center gap-2 text-cyan-200">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                Outlook
              </span>
              <input
                type="checkbox"
                checked={calOutlook}
                onChange={() => setCalOutlook(!calOutlook)}
                className="accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Integrated Tasks list from screenshot */}
        <div className="flex-1 space-y-2 pt-2 border-t border-cyan-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-cyan-400/80 uppercase font-semibold">
              Tasks
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-purple-950 border border-purple-500/40 text-purple-300 rounded-xs">
              {tasks.filter((t) => !t.completed).length} Pending
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs max-h-48 overflow-y-auto pr-1">
            <div className="text-[10px] text-cyan-500/60 uppercase">Today</div>
            {tasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                onClick={async () => {
                  await toggleTask(task.id);
                  await onRefresh();
                }}
                className="flex items-start gap-2 p-1.5 rounded-xs bg-[#010814] hover:bg-cyan-950/40 cursor-pointer transition-colors"
              >
                <div
                  className={`w-3.5 h-3.5 rounded-xs border mt-0.5 flex items-center justify-center shrink-0 ${
                    task.completed
                      ? 'bg-purple-600 border-purple-400 text-white'
                      : 'border-cyan-500/40'
                  }`}
                >
                  {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span
                  className={`text-[11px] leading-tight ${
                    task.completed ? 'line-through text-cyan-600' : 'text-cyan-200'
                  }`}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CALENDAR SCHEDULE: Header bar + 7-Day Time Grid */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#020712]">
        {/* Top Schedule Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3.5 border-b border-cyan-500/20 bg-[#020b18]/90 backdrop-blur-md gap-3 shrink-0">
          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-mono">
              <button
                onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
                className="p-1.5 bg-[#010814] border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 rounded-xs cursor-pointer"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
                className="p-1.5 bg-[#010814] border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 rounded-xs cursor-pointer"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-cyan-100 font-mono tracking-wide">
              {monthYearStr}
            </h2>

            <button
              onClick={() => setCurrentWeekOffset(0)}
              className="px-3 py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-200 text-xs font-mono rounded-xs transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* View Mode & Action Buttons */}
          <div className="flex items-center gap-2 font-mono text-xs">
            {/* View Selector (Week, Day, Month) */}
            <div className="flex items-center bg-[#010814] border border-cyan-500/30 rounded-xs p-0.5">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded-2xs cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-cyan-400/70 hover:text-cyan-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded-2xs cursor-pointer ${
                  viewMode === 'day'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-cyan-400/70 hover:text-cyan-200'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded-2xs cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-cyan-400/70 hover:text-cyan-200'
                }`}
              >
                Month
              </button>
            </div>

            {/* Add Event Button */}
            <button
              onClick={() => {
                setEventDate(weekDays[0].dateStr);
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs rounded-xs transition-all shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* Weekly Time Grid Header (Mon 24, Tue 25...) */}
        <div className="grid grid-cols-8 border-b border-cyan-500/20 bg-[#010a18] text-center font-mono text-xs py-2.5 shrink-0">
          <div className="text-[10px] text-cyan-500/50 flex items-center justify-center font-bold">
            GMT / TIME
          </div>
          {weekDays.map((w, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-center gap-1.5 ${
                w.isToday ? 'text-white font-bold' : 'text-cyan-300'
              }`}
            >
              <span className="text-[11px] text-cyan-500/70">{w.dayName}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  w.isToday
                    ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.8)] font-bold'
                    : 'text-cyan-200'
                }`}
              >
                {w.dayNumber}
              </span>
            </div>
          ))}
        </div>

        {/* Scrollable Time Grid */}
        <div className="flex-1 overflow-y-auto relative">
          {/* Current Time Indicator Line (Dashed horizontal with badge) */}
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
            style={{
              top: `${Math.max(20, ((currentHour - 8) * 60 + currentMinute) * 1.05)}px`,
            }}
          >
            <div className="bg-purple-600 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm shadow-[0_0_10px_rgba(168,85,247,0.9)] ml-2">
              {String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')}
            </div>
            <div className="flex-1 border-t-2 border-dashed border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          </div>

          {/* Time Slot Rows */}
          <div className="divide-y divide-cyan-500/10 min-w-[700px]">
            {hours.map((hourStr, hourIdx) => (
              <div key={hourIdx} className="grid grid-cols-8 min-h-[64px] relative group">
                {/* Time label in left column */}
                <div className="border-r border-cyan-500/15 p-2 font-mono text-[11px] text-cyan-500/60 text-right pr-3 select-none">
                  {hourStr}
                </div>

                {/* 7 Day Slot Cells */}
                {weekDays.map((day, dayIdx) => {
                  // Find events matching this day and hour
                  const cellEvents = filteredEvents.filter((ev) => {
                    const evHour = ev.time.split(':')[0] || '12';
                    const targetHour = hourStr.split(':')[0];
                    return ev.date === day.dateStr && evHour === targetHour;
                  });

                  return (
                    <div
                      key={dayIdx}
                      onClick={() => handleSlotClick(day.dateStr, hourStr)}
                      className="border-r border-cyan-500/10 p-1 relative hover:bg-cyan-950/20 transition-colors cursor-pointer flex flex-col gap-1"
                    >
                      {cellEvents.map((ev) => {
                        const bgStyle = ev.color
                          ? { backgroundColor: `${ev.color}22`, borderColor: `${ev.color}88` }
                          : { backgroundColor: '#06b6d422', borderColor: '#06b6d488' };

                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveEvent(ev);
                            }}
                            style={bgStyle}
                            className="p-1.5 rounded-xs border text-left shadow-sm hover:scale-[1.02] transition-transform cursor-pointer relative group/ev overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span
                                className="text-[10px] font-mono font-bold truncate"
                                style={{ color: ev.color || '#38bdf8' }}
                              >
                                {ev.title}
                              </span>
                              <span className="text-[9px] font-mono text-cyan-400/60 shrink-0">
                                {ev.time}
                              </span>
                            </div>

                            {ev.notes && (
                              <p className="text-[9px] text-cyan-200/70 truncate">{ev.notes}</p>
                            )}

                            {/* AI Suggestion badge like screenshot */}
                            {ev.category === 'Personal' && (
                              <div className="mt-1 flex items-center gap-1 text-[8px] font-mono text-purple-300">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>AI Suggestion</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Event Details */}
      {/* ------------------------------------------------------------- */}
      {activeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#020a18] border border-cyan-500/40 rounded-md p-5 shadow-[0_0_35px_rgba(0,240,255,0.25)] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-xs uppercase font-bold"
                  style={{ backgroundColor: `${activeEvent.color || '#06b6d4'}33`, color: activeEvent.color || '#06b6d4' }}
                >
                  {activeEvent.category}
                </span>
                <h3 className="text-base font-bold text-cyan-100 mt-2">{activeEvent.title}</h3>
              </div>
              <button
                onClick={() => setActiveEvent(null)}
                className="text-cyan-500 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono text-cyan-300 bg-[#010814] p-3 rounded-xs border border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {activeEvent.date} @ {activeEvent.time} ({activeEvent.duration || '60 mins'})
                </span>
              </div>
              {activeEvent.notes && (
                <div className="text-cyan-400/80 pt-1 border-t border-cyan-500/15">
                  {activeEvent.notes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleDeleteEvent(activeEvent.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-mono rounded-xs cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Event</span>
              </button>
              <button
                onClick={() => setActiveEvent(null)}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono rounded-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Quick Add Event */}
      {/* ------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <form
            onSubmit={handleCreateEvent}
            className="w-full max-w-md bg-[#020a18] border border-cyan-500/40 rounded-md p-5 shadow-[0_0_35px_rgba(0,240,255,0.25)] space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
              <h3 className="text-sm font-mono font-bold text-cyan-200 uppercase tracking-wider">
                Schedule Tactical Event
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-cyan-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">EVENT TITLE</label>
              <input
                type="text"
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g. Flight Test Mark 85"
                className="w-full bg-[#010814] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">DATE</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-[#010814] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">TIME</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full bg-[#010814] border border-cyan-500/30 text-cyan-200 text-sm px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">CATEGORY</label>
                <select
                  value={eventCategory}
                  onChange={(e) => {
                    setEventCategory(e.target.value);
                    const colors: Record<string, string> = {
                      Workshop: '#eab308',
                      'Armor Protocol': '#06b6d4',
                      Corporate: '#10b981',
                      Defense: '#f43f5e',
                      Personal: '#8b5cf6',
                    };
                    setEventColor(colors[e.target.value] || '#06b6d4');
                  }}
                  className="w-full bg-[#010814] border border-cyan-500/30 text-cyan-200 text-xs px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400 font-mono"
                >
                  <option value="Workshop">Workshop</option>
                  <option value="Armor Protocol">Armor Protocol</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Defense">Defense</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">DURATION</label>
                <select
                  value={eventDuration}
                  onChange={(e) => setEventDuration(e.target.value)}
                  className="w-full bg-[#010814] border border-cyan-500/30 text-cyan-200 text-xs px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400 font-mono"
                >
                  <option value="30 mins">30 mins</option>
                  <option value="60 mins">60 mins</option>
                  <option value="90 mins">90 mins</option>
                  <option value="120 mins">120 mins</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-cyan-400/80 block mb-1">NOTES</label>
              <textarea
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
                placeholder="Tactical objectives or location..."
                rows={2}
                className="w-full bg-[#010814] border border-cyan-500/30 text-cyan-200 text-xs px-3 py-1.5 rounded-xs focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs font-mono text-cyan-400/70 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-mono font-bold text-xs rounded-xs cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.4)]"
              >
                {isSubmitting ? 'Scheduling...' : 'Authorize Event'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
