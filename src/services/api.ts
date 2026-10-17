import { JarvisDataStore, CalendarEvent, TaskItem, ProjectItem, ReminderItem } from '../types';

export const fetchJarvisData = async (): Promise<JarvisDataStore> => {
  const res = await fetch('/api/jarvis/data');
  if (!res.ok) throw new Error('Failed to fetch JARVIS memory bank');
  return res.json();
};

export const sendJarvisCommand = async (command: string): Promise<{
  text: string;
  executedTool?: any;
  store: JarvisDataStore;
}> => {
  const res = await fetch('/api/jarvis/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to process command');
  }
  return res.json();
};

export const requestJarvisTts = async (text: string): Promise<{
  audioBase64?: string;
  mimeType?: string;
  fallback?: boolean;
}> => {
  try {
    const res = await fetch('/api/jarvis/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return { fallback: true };
    return res.json();
  } catch (err) {
    return { fallback: true };
  }
};

// Direct dashboard mutations
export const addCalendarEvent = async (event: Partial<CalendarEvent>): Promise<{ success: boolean; event: CalendarEvent }> => {
  const res = await fetch('/api/jarvis/calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  return res.json();
};

export const deleteCalendarEvent = async (id: string): Promise<{ success: boolean }> => {
  const res = await fetch(`/api/jarvis/calendar/${id}`, { method: 'DELETE' });
  return res.json();
};

export const addTask = async (task: Partial<TaskItem>): Promise<{ success: boolean; task: TaskItem }> => {
  const res = await fetch('/api/jarvis/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return res.json();
};

export const toggleTask = async (id: string): Promise<{ success: boolean; task: TaskItem }> => {
  const res = await fetch(`/api/jarvis/tasks/${id}/toggle`, { method: 'PATCH' });
  return res.json();
};

export const deleteTask = async (id: string): Promise<{ success: boolean }> => {
  const res = await fetch(`/api/jarvis/tasks/${id}`, { method: 'DELETE' });
  return res.json();
};

export const addProject = async (project: Partial<ProjectItem>): Promise<{ success: boolean; project: ProjectItem }> => {
  const res = await fetch('/api/jarvis/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  return res.json();
};

export const updateProjectProgress = async (id: string, progress: number): Promise<{ success: boolean; project: ProjectItem }> => {
  const res = await fetch(`/api/jarvis/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ progress }),
  });
  return res.json();
};

export const deleteProject = async (id: string): Promise<{ success: boolean }> => {
  const res = await fetch(`/api/jarvis/projects/${id}`, { method: 'DELETE' });
  return res.json();
};

export const addReminder = async (reminder: Partial<ReminderItem>): Promise<{ success: boolean; reminder: ReminderItem }> => {
  const res = await fetch('/api/jarvis/reminders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reminder),
  });
  return res.json();
};

export const deleteReminder = async (id: string): Promise<{ success: boolean }> => {
  const res = await fetch(`/api/jarvis/reminders/${id}`, { method: 'DELETE' });
  return res.json();
};
