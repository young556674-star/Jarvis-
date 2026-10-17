export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  duration?: string;
  notes?: string;
  category: string;
  created_at?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueDate?: string;
  created_at?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'active' | 'planning' | 'completed' | 'on-hold';
  tag: string;
  updated_at?: string;
}

export interface ReminderItem {
  id: string;
  text: string;
  time: string;
  priority: 'normal' | 'high';
  dismissed: boolean;
  created_at?: string;
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
  systemStats: SystemStats;
}

export type JarvisState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
