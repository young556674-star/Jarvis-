export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string; // HH:mm format e.g. "09:00"
  duration?: string; // e.g. "60 mins"
  notes?: string;
  category: string;
  color?: string; // hex or tailwind accent e.g. "#38bdf8", "#eab308", "#ec4899", "#8b5cf6"
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueDate?: string;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'active' | 'planning' | 'completed' | 'on-hold';
  tag: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReminderItem {
  id: string;
  text: string;
  time: string;
  priority: 'normal' | 'high';
  dismissed: boolean;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemoryItem {
  id: string;
  content: string;
  category: 'project' | 'preference' | 'personal' | 'general' | 'deadline';
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface SystemStats {
  coreTemperature: string;
  reactorOutput: string;
  suitEfficiency: string;
  defenseGrid: string;
  neuroLinkLatency: string;
}

export interface JarvisDataStore {
  calendar: CalendarEvent[];
  tasks: TaskItem[];
  projects: ProjectItem[];
  reminders: ReminderItem[];
  memories: MemoryItem[];
  systemStats: SystemStats;
}

export type JarvisState = 'sleeping' | 'waking' | 'listening' | 'processing' | 'speaking' | 'idle' | 'error';
