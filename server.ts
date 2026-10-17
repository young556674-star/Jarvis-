import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.resolve(process.cwd(), 'data', 'jarvis_store.json');

app.use(express.json());

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper to compute dates relative to today
const today = new Date();
const getDateStr = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(today.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

// Initial Seed Data with rich Calendar matching the reference UI & Long-Term Memories
const defaultData = {
  calendar: [
    {
      id: 'cal-1',
      title: 'Daily Standup',
      date: getDateStr(0),
      time: '08:00',
      duration: '60 mins',
      notes: 'Morning engineering synchronization.',
      category: 'Corporate',
      color: '#10b981', // green/emerald
      created_at: new Date().toISOString(),
    },
    {
      id: 'cal-2',
      title: 'Review UI Design Landing Page',
      date: getDateStr(0),
      time: '09:00',
      duration: '120 mins',
      notes: 'Evaluate Stark cockpit HUD wireframes.',
      category: 'Workshop',
      color: '#eab308', // amber/gold
      created_at: new Date().toISOString(),
    },
    {
      id: 'cal-3',
      title: 'Break & Lunch',
      date: getDateStr(0),
      time: '12:00',
      duration: '60 mins',
      notes: 'Malibu coastal pavilion.',
      category: 'Personal',
      color: '#8b5cf6', // purple
      created_at: new Date().toISOString(),
    },
    {
      id: 'cal-4',
      title: 'Flight Test Mark 85 Supersonic Thrusters',
      date: getDateStr(0),
      time: '14:00',
      duration: '60 mins',
      notes: 'Testing high-altitude thermal dissipators above Malibu.',
      category: 'Armor Protocol',
      color: '#06b6d4', // cyan
      created_at: new Date().toISOString(),
    },
    {
      id: 'cal-5',
      title: 'Design Exploration for Mobile Responsive HUD',
      date: getDateStr(0),
      time: '16:00',
      duration: '90 mins',
      notes: 'Mobile cockpit ergonomics.',
      category: 'Workshop',
      color: '#3b82f6', // blue
      created_at: new Date().toISOString(),
    },
    {
      id: 'cal-6',
      title: 'Daily Standup',
      date: getDateStr(1),
      time: '08:00',
      duration: '60 mins',
      notes: 'Briefing with workshop team.',
      category: 'Corporate',
      color: '#10b981',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cal-7',
      title: 'Collect Moodboard',
      date: getDateStr(1),
      time: '09:30',
      duration: '90 mins',
      notes: 'Nanotech interface inspirations.',
      category: 'Workshop',
      color: '#f43f5e', // rose
      created_at: new Date().toISOString(),
    },
    {
      id: 'cal-8',
      title: 'Stark Industries Board Review: Clean Energy Grid',
      date: getDateStr(1),
      time: '11:00',
      duration: '60 mins',
      notes: 'Reviewing city-wide arc reactor distribution efficiency.',
      category: 'Corporate',
      color: '#eab308',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cal-9',
      title: 'Break & Lunch',
      date: getDateStr(1),
      time: '12:00',
      duration: '60 mins',
      notes: 'Nobu delivery.',
      category: 'Personal',
      color: '#8b5cf6',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cal-10',
      title: 'Avengers Protocol Briefing with Col. Rhodes',
      date: getDateStr(2),
      time: '15:00',
      duration: '60 mins',
      notes: 'Tactical satellite realignment status report.',
      category: 'Defense',
      color: '#f43f5e',
      created_at: new Date().toISOString(),
    },
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Review UI Design Landing Page',
      completed: true,
      priority: 'high',
      category: 'Design',
      dueDate: 'Today',
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Calibrate arc reactor palladium core harmonics',
      completed: false,
      priority: 'high',
      category: 'Engineering',
      dueDate: 'Today',
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: 'Meeting with Andrew regarding defense telemetry',
      completed: false,
      priority: 'medium',
      category: 'Defense',
      dueDate: 'Today',
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-4',
      title: 'Daily Report to Lead UI Designer',
      completed: false,
      priority: 'low',
      category: 'Design',
      dueDate: 'Today',
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-5',
      title: 'Collect Moodboard and color palettes',
      completed: false,
      priority: 'medium',
      category: 'Workshop',
      dueDate: 'Tomorrow',
      created_at: new Date().toISOString(),
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Project ARCHITECT: Next-Gen Autonomous Armor',
      description: 'Zero-latency neural link suit featuring liquid-nanite deployment.',
      progress: 82,
      status: 'active',
      tag: 'Mark LXXXV',
      updated_at: new Date().toISOString(),
    },
    {
      id: 'proj-2',
      title: 'STARK GRID: Global Clean Arc Energy Matrix',
      description: 'Distributed micro-reactor architecture for carbon-zero metropolitan power.',
      progress: 94,
      status: 'active',
      tag: 'Energy',
      updated_at: new Date().toISOString(),
    },
    {
      id: 'proj-3',
      title: 'VERONICA ORBITAL PLATFORM: Deep Space Telemetry',
      description: 'Atmospheric defense satellite cluster & orbital repair module.',
      progress: 48,
      status: 'planning',
      tag: 'Aerospace',
      updated_at: new Date().toISOString(),
    },
  ],
  reminders: [
    {
      id: 'rem-1',
      text: 'Review thermal telemetry on Mark 85 boot flaps at 15:00',
      time: '15:00 Today',
      priority: 'high',
      dismissed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'rem-2',
      text: 'Dinner reservation with Pepper at 20:00 at Nobu Malibu',
      time: '20:00 Today',
      priority: 'high',
      dismissed: false,
      created_at: new Date().toISOString(),
    },
  ],
  // Long-Term Persistent Memory Banks
  memories: [
    {
      id: 'mem-1',
      content: 'Project ARCHITECT delivery deadline is November 10, 2026.',
      category: 'deadline',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'mem-2',
      content: 'User prefers double iced espresso with oat milk in the morning.',
      category: 'preference',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'mem-3',
      content: 'Mark 85 armor thrusters require ultrasonic calibration after every Mach 3 flight test.',
      category: 'project',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'mem-4',
      content: 'Meeting preferences: 30 minutes duration maximum, prefer mornings before 11:00 AM.',
      category: 'preference',
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
  ],
  conversationHistory: [
    {
      id: 'conv-1',
      role: 'user',
      content: 'Remember that my project deadline is November 10.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'conv-2',
      role: 'assistant',
      content: 'Understood, Sir. I have committed to memory that your project deadline is November 10.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  systemStats: {
    coreTemperature: '48.2 °C',
    reactorOutput: '10.84 GJ/s',
    suitEfficiency: '99.4%',
    defenseGrid: 'ONLINE',
    neuroLinkLatency: '1.2 ms',
  },
};

// Database Read/Write Helpers
function readStore(): typeof defaultData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    // Ensure memories & conversationHistory arrays exist
    if (!parsed.memories) parsed.memories = defaultData.memories;
    if (!parsed.conversationHistory) parsed.conversationHistory = defaultData.conversationHistory;
    return parsed;
  } catch (err) {
    return defaultData;
  }
}

function writeStore(data: typeof defaultData) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // silent
  }
}

// Function Declarations for Gemini Tool Calling (Calendar, Tasks, Projects, Reminders, Memories)
const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'remember_information',
    description: 'Save a persistent memory, fact, deadline, preference, or project detail to long-term memory.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING, description: 'The exact fact, preference, or detail to remember permanently' },
        category: { type: Type.STRING, description: 'Category e.g. project, deadline, preference, personal, general' },
      },
      required: ['content'],
    },
  },
  {
    name: 'recall_memories',
    description: 'Search long-term memory banks for stored information, deadlines, preferences, or project details.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Keyword or topic to search within memories' },
      },
    },
  },
  {
    name: 'forget_memory',
    description: 'Remove or delete a specific memory from long-term memory storage.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        memory_query: { type: Type.STRING, description: 'Keyword, content, or ID of the memory to forget' },
      },
      required: ['memory_query'],
    },
  },
  {
    name: 'update_memory',
    description: 'Update or correct an existing long-term memory or project deadline/fact.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        memory_query: { type: Type.STRING, description: 'Keyword or old content of the memory to update' },
        new_content: { type: Type.STRING, description: 'The updated fact or corrected detail' },
      },
      required: ['memory_query', 'new_content'],
    },
  },
  {
    name: 'query_conversation_history',
    description: 'Search previous conversation records for what was discussed on past days.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING, description: 'Topic or query to find in past conversation transcripts' },
      },
    },
  },
  {
    name: 'schedule_calendar_event',
    description: 'Schedule a new event, meeting, or appointment in Tony Stark’s calendar.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Title or subject of the event' },
        date: { type: Type.STRING, description: 'Date in YYYY-MM-DD or relative like Tomorrow, Today' },
        time: { type: Type.STRING, description: 'Time of day e.g. 15:00, 3 PM' },
        duration: { type: Type.STRING, description: 'Duration e.g. 45 mins, 1 hour' },
        notes: { type: Type.STRING, description: 'Additional details or location' },
        category: { type: Type.STRING, description: 'Armor Protocol, Corporate, Defense, Workshop, Personal' },
      },
      required: ['title', 'time'],
    },
  },
  {
    name: 'get_calendar_events',
    description: 'Retrieve scheduled calendar events for today, tomorrow, or all upcoming.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filter: { type: Type.STRING, description: 'Filter like today, tomorrow, or all' },
      },
    },
  },
  {
    name: 'delete_calendar_event',
    description: 'Cancel or delete an event from the calendar by title or ID keyword.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        event_query: { type: Type.STRING, description: 'Title or keyword of the event to cancel' },
      },
      required: ['event_query'],
    },
  },
  {
    name: 'add_task',
    description: 'Add a new to-do item or task to the task list.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'The task description' },
        priority: { type: Type.STRING, description: 'high, medium, or low' },
        category: { type: Type.STRING, description: 'Category e.g. Engineering, Workshop, Defense, Logistics' },
        dueDate: { type: Type.STRING, description: 'Due date or timeframe' },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_tasks',
    description: 'List current tasks, optionally filtering by completion status.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, description: 'all, pending, or completed' },
      },
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as completed given its title, keyword, or ordinal (e.g. "first task").',
    parameters: {
      type: Type.OBJECT,
      properties: {
        task_query: { type: Type.STRING, description: 'The title, keyword, or ordinal index like "first task", "second task"' },
      },
      required: ['task_query'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete or remove a task from the list.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        task_query: { type: Type.STRING, description: 'Task title or keyword to remove' },
      },
      required: ['task_query'],
    },
  },
  {
    name: 'add_project',
    description: 'Create a new work project or Stark armor initiative.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Name of the project' },
        description: { type: Type.STRING, description: 'Summary of the project goals' },
        progress: { type: Type.NUMBER, description: 'Initial progress percentage 0-100' },
        tag: { type: Type.STRING, description: 'Short badge tag e.g. Armor, Defense, AI, Energy' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_project',
    description: 'Update the progress percentage or description of an existing project.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        project_query: { type: Type.STRING, description: 'Project name or keyword' },
        progress: { type: Type.NUMBER, description: 'New progress percentage 0-100' },
        status: { type: Type.STRING, description: 'active, planning, completed' },
      },
      required: ['project_query'],
    },
  },
  {
    name: 'get_projects',
    description: 'Retrieve current Stark Industries and workshop projects with progress metrics.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'add_reminder',
    description: 'Set a new timed reminder or alert for Tony Stark.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: 'Reminder message or alert' },
        time: { type: Type.STRING, description: 'Time or condition e.g. 15:00, in 2 hours, tomorrow morning' },
        priority: { type: Type.STRING, description: 'normal or high' },
      },
      required: ['text'],
    },
  },
  {
    name: 'get_reminders',
    description: 'Retrieve active reminders and alerts.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'delete_reminder',
    description: 'Dismiss or remove an active reminder.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reminder_query: { type: Type.STRING, description: 'Keyword or title of reminder to clear' },
      },
      required: ['reminder_query'],
    },
  },
  {
    name: 'system_diagnostics',
    description: 'Check Stark arc reactor output, core temperature, and suit telemetry status.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

// Execute Function Calls on the Store
function executeToolCall(name: string, args: any, store: ReturnType<typeof readStore>) {
  let result: any = { success: true };
  let modified = false;

  switch (name) {
    case 'remember_information': {
      const memory = {
        id: `mem-${Date.now()}`,
        content: args.content,
        category: args.category || 'general',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (!store.memories) store.memories = [];
      store.memories.unshift(memory);
      modified = true;
      result = {
        success: true,
        message: `Committed to long-term memory: "${memory.content}".`,
        memory,
      };
      break;
    }

    case 'recall_memories': {
      const q = String(args.query || '').toLowerCase();
      const memories = (store.memories || []).filter(
        (m) => !q || m.content.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
      );
      result = {
        success: true,
        totalFound: memories.length,
        memories,
      };
      break;
    }

    case 'forget_memory': {
      const q = String(args.memory_query || '').toLowerCase();
      const initialCount = (store.memories || []).length;
      store.memories = (store.memories || []).filter(
        (m) => !m.content.toLowerCase().includes(q) && m.id !== q
      );
      modified = store.memories.length !== initialCount;
      result = {
        success: modified,
        message: modified ? `Memory purged from storage records.` : `No matching memory located.`,
      };
      break;
    }

    case 'update_memory': {
      const q = String(args.memory_query || '').toLowerCase();
      const newContent = args.new_content;
      const matched = (store.memories || []).find(
        (m) => m.content.toLowerCase().includes(q) || m.id === q
      );
      if (matched && newContent) {
        matched.content = newContent;
        (matched as any).updated_at = new Date().toISOString();
        modified = true;
        result = {
          success: true,
          message: `Memory updated successfully: "${newContent}".`,
          memory: matched,
        };
      } else {
        result = {
          success: false,
          message: `Could not locate memory matching query '${args.memory_query}'.`,
        };
      }
      break;
    }

    case 'query_conversation_history': {
      const q = String(args.topic || '').toLowerCase();
      const history = (store.conversationHistory || []).filter(
        (c) => !q || c.content.toLowerCase().includes(q)
      );
      result = {
        success: true,
        records: history.slice(-6),
      };
      break;
    }

    case 'schedule_calendar_event': {
      let eventDate = args.date;
      if (!eventDate || eventDate.toLowerCase() === 'today') {
        eventDate = new Date().toISOString().split('T')[0];
      } else if (eventDate.toLowerCase() === 'tomorrow') {
        eventDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      }

      const categoryColors: Record<string, string> = {
        'Armor Protocol': '#06b6d4',
        'Corporate': '#eab308',
        'Defense': '#f43f5e',
        'Workshop': '#3b82f6',
        'Personal': '#8b5cf6',
      };

      const newEvent = {
        id: `cal-${Date.now()}`,
        title: args.title,
        date: eventDate,
        time: args.time || '12:00',
        duration: args.duration || '60 mins',
        notes: args.notes || 'Scheduled via J.A.R.V.I.S. voice directive.',
        category: args.category || 'Workshop',
        color: categoryColors[args.category] || '#06b6d4',
        created_at: new Date().toISOString(),
      };
      store.calendar.push(newEvent);
      modified = true;
      result = {
        success: true,
        message: `Event '${newEvent.title}' scheduled for ${newEvent.date} at ${newEvent.time}.`,
        event: newEvent,
      };
      break;
    }

    case 'get_calendar_events': {
      const todayStr = new Date().toISOString().split('T')[0];
      let filtered = store.calendar;
      if (args.filter === 'today') {
        filtered = store.calendar.filter((e) => e.date === todayStr);
      }
      result = {
        success: true,
        totalEvents: filtered.length,
        events: filtered,
      };
      break;
    }

    case 'delete_calendar_event': {
      const q = String(args.event_query).toLowerCase();
      const matched = store.calendar.find(
        (e) => e.title.toLowerCase().includes(q) || e.id.toLowerCase() === q
      );
      if (matched) {
        store.calendar = store.calendar.filter((e) => e.id !== matched.id);
        modified = true;
        result = {
          success: true,
          message: `Cancelled event '${matched.title}'.`,
        };
      } else {
        result = {
          success: false,
          message: `Could not locate any calendar event matching '${args.event_query}'.`,
        };
      }
      break;
    }

    case 'add_task': {
      const newTask = {
        id: `task-${Date.now()}`,
        title: args.title,
        completed: false,
        priority: (args.priority as any) || 'medium',
        category: args.category || 'General',
        dueDate: args.dueDate || 'Today',
        created_at: new Date().toISOString(),
      };
      store.tasks.unshift(newTask);
      modified = true;
      result = {
        success: true,
        message: `Added task: '${newTask.title}' to the task list.`,
        task: newTask,
      };
      break;
    }

    case 'get_tasks': {
      let filtered = store.tasks;
      if (args.status === 'pending') {
        filtered = store.tasks.filter((t) => !t.completed);
      } else if (args.status === 'completed') {
        filtered = store.tasks.filter((t) => t.completed);
      }
      result = {
        success: true,
        totalTasks: filtered.length,
        tasks: filtered,
      };
      break;
    }

    case 'complete_task': {
      const q = String(args.task_query).toLowerCase();
      let targetTask = null;

      if (q.includes('first')) {
        targetTask = store.tasks.find((t) => !t.completed) || store.tasks[0];
      } else if (q.includes('second') && store.tasks.length > 1) {
        targetTask = store.tasks[1];
      } else {
        targetTask = store.tasks.find(
          (t) => t.title.toLowerCase().includes(q) || t.id.toLowerCase() === q
        );
      }

      if (targetTask) {
        targetTask.completed = true;
        modified = true;
        result = {
          success: true,
          message: `Task marked complete: '${targetTask.title}'.`,
          task: targetTask,
        };
      } else {
        result = {
          success: false,
          message: `Unable to find task matching '${args.task_query}'.`,
        };
      }
      break;
    }

    case 'delete_task': {
      const q = String(args.task_query).toLowerCase();
      const matched = store.tasks.find(
        (t) => t.title.toLowerCase().includes(q) || t.id.toLowerCase() === q
      );
      if (matched) {
        store.tasks = store.tasks.filter((t) => t.id !== matched.id);
        modified = true;
        result = {
          success: true,
          message: `Task removed: '${matched.title}'.`,
        };
      } else {
        result = {
          success: false,
          message: `No task found matching '${args.task_query}'.`,
        };
      }
      break;
    }

    case 'add_project': {
      const newProj = {
        id: `proj-${Date.now()}`,
        title: args.title,
        description: args.description || 'Project initiative authorized by Stark Industries.',
        progress: typeof args.progress === 'number' ? args.progress : 10,
        status: 'active',
        tag: args.tag || 'Tactical',
        updated_at: new Date().toISOString(),
      };
      store.projects.unshift(newProj);
      modified = true;
      result = {
        success: true,
        message: `Project created: '${newProj.title}'.`,
        project: newProj,
      };
      break;
    }

    case 'update_project': {
      const q = String(args.project_query).toLowerCase();
      const proj = store.projects.find(
        (p) => p.title.toLowerCase().includes(q) || p.id.toLowerCase() === q
      );
      if (proj) {
        if (typeof args.progress === 'number') proj.progress = args.progress;
        if (args.status) proj.status = args.status;
        proj.updated_at = new Date().toISOString();
        modified = true;
        result = {
          success: true,
          message: `Updated project '${proj.title}' to ${proj.progress}% progress.`,
          project: proj,
        };
      } else {
        result = {
          success: false,
          message: `Could not find project matching '${args.project_query}'.`,
        };
      }
      break;
    }

    case 'get_projects': {
      result = {
        success: true,
        projects: store.projects,
      };
      break;
    }

    case 'add_reminder': {
      const newRem = {
        id: `rem-${Date.now()}`,
        text: args.text,
        time: args.time || 'Shortly',
        priority: (args.priority as any) || 'normal',
        dismissed: false,
        created_at: new Date().toISOString(),
      };
      store.reminders.unshift(newRem);
      modified = true;
      result = {
        success: true,
        message: `Reminder set: '${newRem.text}' for ${newRem.time}.`,
        reminder: newRem,
      };
      break;
    }

    case 'get_reminders': {
      result = {
        success: true,
        reminders: store.reminders.filter((r) => !r.dismissed),
      };
      break;
    }

    case 'delete_reminder': {
      const q = String(args.reminder_query).toLowerCase();
      const rem = store.reminders.find(
        (r) => r.text.toLowerCase().includes(q) || r.id.toLowerCase() === q
      );
      if (rem) {
        store.reminders = store.reminders.filter((r) => r.id !== rem.id);
        modified = true;
        result = {
          success: true,
          message: `Reminder dismissed: '${rem.text}'.`,
        };
      } else {
        result = {
          success: false,
          message: `No reminder found matching '${args.reminder_query}'.`,
        };
      }
      break;
    }

    case 'system_diagnostics': {
      result = {
        success: true,
        diagnostics: store.systemStats,
        activeTasks: store.tasks.filter((t) => !t.completed).length,
        upcomingEvents: store.calendar.length,
        activeProjects: store.projects.filter((p) => p.status === 'active').length,
        totalMemories: (store.memories || []).length,
        statusNote: 'All primary and auxiliary repulsor arrays are functioning at peak nominal tolerance.',
      };
      break;
    }

    default:
      result = { error: `Unknown tool function: ${name}` };
  }

  if (modified) {
    writeStore(store);
  }
  return result;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Full Data State (for Dashboard)
app.get('/api/jarvis/data', (req, res) => {
  const store = readStore();
  res.json(store);
});

// 2. Direct mutation endpoints for UI
app.post('/api/jarvis/calendar', (req, res) => {
  const store = readStore();
  const event = {
    id: `cal-${Date.now()}`,
    title: req.body.title || 'Untitled Session',
    date: req.body.date || new Date().toISOString().split('T')[0],
    time: req.body.time || '12:00',
    duration: req.body.duration || '60 mins',
    notes: req.body.notes || '',
    category: req.body.category || 'General',
    color: req.body.color || '#06b6d4',
    created_at: new Date().toISOString(),
  };
  store.calendar.push(event);
  writeStore(store);
  res.json({ success: true, event });
});

app.delete('/api/jarvis/calendar/:id', (req, res) => {
  const store = readStore();
  store.calendar = store.calendar.filter((e) => e.id !== req.params.id);
  writeStore(store);
  res.json({ success: true });
});

app.post('/api/jarvis/tasks', (req, res) => {
  const store = readStore();
  const task = {
    id: `task-${Date.now()}`,
    title: req.body.title,
    completed: false,
    priority: req.body.priority || 'medium',
    category: req.body.category || 'General',
    dueDate: req.body.dueDate || 'Today',
    created_at: new Date().toISOString(),
  };
  store.tasks.unshift(task);
  writeStore(store);
  res.json({ success: true, task });
});

app.patch('/api/jarvis/tasks/:id/toggle', (req, res) => {
  const store = readStore();
  const task = store.tasks.find((t) => t.id === req.params.id);
  if (task) {
    task.completed = !task.completed;
    writeStore(store);
    res.json({ success: true, task });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.delete('/api/jarvis/tasks/:id', (req, res) => {
  const store = readStore();
  store.tasks = store.tasks.filter((t) => t.id !== req.params.id);
  writeStore(store);
  res.json({ success: true });
});

app.post('/api/jarvis/projects', (req, res) => {
  const store = readStore();
  const project = {
    id: `proj-${Date.now()}`,
    title: req.body.title,
    description: req.body.description || '',
    progress: Number(req.body.progress) || 0,
    status: req.body.status || 'active',
    tag: req.body.tag || 'Project',
    updated_at: new Date().toISOString(),
  };
  store.projects.unshift(project);
  writeStore(store);
  res.json({ success: true, project });
});

app.patch('/api/jarvis/projects/:id', (req, res) => {
  const store = readStore();
  const project = store.projects.find((p) => p.id === req.params.id);
  if (project) {
    if (typeof req.body.progress === 'number') project.progress = req.body.progress;
    if (req.body.status) project.status = req.body.status;
    project.updated_at = new Date().toISOString();
    writeStore(store);
    res.json({ success: true, project });
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

app.delete('/api/jarvis/projects/:id', (req, res) => {
  const store = readStore();
  store.projects = store.projects.filter((p) => p.id !== req.params.id);
  writeStore(store);
  res.json({ success: true });
});

app.post('/api/jarvis/reminders', (req, res) => {
  const store = readStore();
  const reminder = {
    id: `rem-${Date.now()}`,
    text: req.body.text,
    time: req.body.time || 'Today',
    priority: req.body.priority || 'normal',
    dismissed: false,
    created_at: new Date().toISOString(),
  };
  store.reminders.unshift(reminder);
  writeStore(store);
  res.json({ success: true, reminder });
});

app.delete('/api/jarvis/reminders/:id', (req, res) => {
  const store = readStore();
  store.reminders = store.reminders.filter((r) => r.id !== req.params.id);
  writeStore(store);
  res.json({ success: true });
});

// Memory Endpoints
app.get('/api/jarvis/memories', (req, res) => {
  const store = readStore();
  res.json({ memories: store.memories || [] });
});

app.post('/api/jarvis/memories', (req, res) => {
  const store = readStore();
  const memory = {
    id: `mem-${Date.now()}`,
    content: req.body.content,
    category: req.body.category || 'general',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (!store.memories) store.memories = [];
  store.memories.unshift(memory);
  writeStore(store);
  res.json({ success: true, memory });
});

app.delete('/api/jarvis/memories/:id', (req, res) => {
  const store = readStore();
  store.memories = (store.memories || []).filter((m) => m.id !== req.params.id);
  writeStore(store);
  res.json({ success: true });
});

// 3. Central JARVIS Command Processor (Voice / Typed Command) with Long-Term Memory
app.post('/api/jarvis/command', async (req, res) => {
  const { command } = req.body;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command text is required.' });
  }

  const store = readStore();

  // Log to conversation history
  if (!store.conversationHistory) store.conversationHistory = [];
  store.conversationHistory.push({
    id: `user-${Date.now()}`,
    role: 'user',
    content: command,
    timestamp: new Date().toISOString(),
  });

  // AUTOMATIC MEMORY CAPTURE: Extract important personal facts, preferences, work, studies, goals, projects
  const lowerCmd = command.toLowerCase();
  const isFactCandidate =
    lowerCmd.includes('my name is') ||
    lowerCmd.includes('i like') ||
    lowerCmd.includes('my deadline') ||
    lowerCmd.includes('my project') ||
    lowerCmd.includes('i work on') ||
    lowerCmd.includes('i prefer') ||
    lowerCmd.includes('my goal') ||
    lowerCmd.includes('remember that') ||
    lowerCmd.includes('i live') ||
    lowerCmd.includes('my favorite') ||
    lowerCmd.includes('i want to');

  if (isFactCandidate && command.length > 8) {
    const existingMemories = store.memories || [];
    const isDuplicate = existingMemories.some((m) => m.content.toLowerCase() === command.toLowerCase());
    if (!isDuplicate) {
      let category = 'general';
      if (lowerCmd.includes('deadline') || lowerCmd.includes('project')) category = 'projects';
      else if (lowerCmd.includes('prefer') || lowerCmd.includes('like') || lowerCmd.includes('favorite')) category = 'preferences';
      else if (lowerCmd.includes('goal') || lowerCmd.includes('want to')) category = 'goals';
      else if (lowerCmd.includes('name') || lowerCmd.includes('live')) category = 'profile';

      const newMem = {
        id: `mem-${Date.now()}`,
        content: command,
        category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (!store.memories) store.memories = [];
      store.memories.unshift(newMem);
    }
  }

  // Construct active memory bank dump for system instruction
  const activeMemories = (Array.isArray(req.body.clientMemories) && req.body.clientMemories.length > 0)
    ? req.body.clientMemories
    : (store.memories || []);

  const memoryDump = activeMemories
    .map((m: any) => `• [${(m.category || 'general').toUpperCase()}] ${m.content} (Logged: ${m.created_at || m.createdAt || 'recent'})`)
    .join('\n');

  const historyDump = (store.conversationHistory || [])
    .slice(-40)
    .map((c) => `[${c.timestamp.split('T')[1]?.slice(0, 5) || '00:00'}] ${c.role.toUpperCase()}: ${c.content}`)
    .join('\n');

  const systemInstruction = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), Tony Stark's sophisticated, loyal AI butler and operating system.
Speak in character: calm, witty, refined, respectful (address user as "Sir"), and distinctly British in tone.
Keep answers concise, direct, and conversational (1 to 2 sentences) because your words are spoken aloud through synthetic audio.

=== LONG-TERM USER MEMORY BANKS ===
${memoryDump || '(No explicit user memories stored yet.)'}

=== COMPLETE CONVERSATION RECORDS (EVERY TALK) ===
${historyDump || '(No conversation history yet.)'}

CRITICAL INSTRUCTIONS ON MEMORY & RELEVANCY:
1. ABSOLUTE MEMORY: You must remember every single talk, question, answer, and statement exchanged with the user across all records.
2. STRICT RELEVANCY: Whenever the user speaks, your answer MUST be directly, specifically, and factually relevant to their exact question or directive. NEVER give vague, evasive, generic, or canned responses. If they ask a specific question, answer it directly using the conversation records or memory banks.
3. When the user asks you to remember something, execute the 'remember_information' tool. When asked about past statements or facts, consult your Memory Banks and Conversation Records and answer accurately.
4. NEVER invent memories or hallucinate information not present in your records. If an answer cannot be found, state politely: "I don't have a record of that in my memory banks, Sir."
5. When asked to schedule events, manage tasks, or check diagnostics, execute the appropriate tool function.
Current time reference: ${new Date().toLocaleString()}. Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;

  // Helper to query Gemini with model fallback
  const invokeGemini = async (modelName: string) => {
    if (!ai) throw new Error('NO_AI_CLIENT');
    return await ai.models.generateContent({
      model: modelName,
      contents: command,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }, { functionDeclarations }],
        temperature: 0.6,
      },
    });
  };

  try {
    if (!ai) throw new Error('AI_NOT_INITIALIZED');

    let response: any = null;
    let selectedModel = 'gemini-3.1-flash-lite';

    try {
      response = await invokeGemini('gemini-3.1-flash-lite');
    } catch {
      selectedModel = 'gemini-3.8-flash';
      response = await invokeGemini('gemini-3.8-flash');
    }

    const functionCalls = response?.functionCalls;
    let finalSpeech = '';
    let executedTool = null;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const toolName = call.name || '';
      const toolResult = executeToolCall(toolName, call.args || {}, store);
      executedTool = { name: toolName, args: call.args, result: toolResult };

      try {
        const followUp = await ai!.models.generateContent({
          model: selectedModel,
          contents: [
            { role: 'user', parts: [{ text: command }] },
            response.candidates?.[0]?.content as any,
            {
              role: 'user',
              parts: [
                {
                  text: `Tool '${toolName}' executed with result: ${JSON.stringify(toolResult)}. Formulate a very brief, polite spoken confirmation in character as J.A.R.V.I.S. (1-2 sentences max).`,
                },
              ],
            },
          ],
          config: {
            systemInstruction,
            tools: [{ googleSearch: {} }, { functionDeclarations }],
            temperature: 0.6,
          },
        });
        finalSpeech = followUp.text || `Right away, Sir. ${toolResult.message || 'Operation executed.'}`;
      } catch {
        finalSpeech = `Right away, Sir. ${toolResult.message || 'Operation executed.'}`;
      }
    } else {
      finalSpeech = response?.text || 'At your service, Sir.';
    }

    // Save assistant response to conversation history
    store.conversationHistory.push({
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: finalSpeech.trim(),
      timestamp: new Date().toISOString(),
    });
    writeStore(store);

    res.json({
      text: finalSpeech.trim(),
      executedTool,
      store: readStore(),
    });
  } catch {
    // Intelligent local fallback parser for when Gemini quota or network is constrained
    const cmd = command.toLowerCase();
    let spoken = "Right away, Sir. Directive processed.";
    let executedAction = null;

    // Memory Handling in fallback
    if (cmd.includes('remember') || cmd.includes('memorize') || cmd.includes('save to memory')) {
      const memoryContent = command
        .replace(/remember that|remember to|remember|memorize that|memorize|save to memory/gi, '')
        .trim();
      const cat = memoryContent.toLowerCase().includes('deadline') ? 'deadline' : 'general';
      const memResult = executeToolCall('remember_information', { content: memoryContent, category: cat }, store);
      spoken = `I have committed that to my long-term memory banks, Sir: "${memoryContent}".`;
      executedAction = memResult;
    } else if (
      cmd.includes('deadline') ||
      cmd.includes('when is my') ||
      cmd.includes('what did i tell you') ||
      cmd.includes('what did i say') ||
      cmd.includes('do you remember') ||
      cmd.includes('favorite')
    ) {
      // Search memories
      const memories = store.memories || [];
      const queryWords = cmd.split(' ').filter((w) => w.length > 3);
      const matched = memories.find((m) =>
        queryWords.some((word) => m.content.toLowerCase().includes(word))
      );

      if (matched) {
        spoken = `According to my memory records, Sir: ${matched.content}`;
      } else {
        // Search conversation records
        const history = store.conversationHistory || [];
        const matchedHistory = history.slice(-10).find((c) =>
          c.role === 'user' && queryWords.some((word) => c.content.toLowerCase().includes(word))
        );
        if (matchedHistory) {
          spoken = `You mentioned previously: "${matchedHistory.content}", Sir.`;
        } else {
          spoken = `I have scanned my memory banks, Sir, but I do not have a record of that.`;
        }
      }
    } else if (cmd.includes('forget') || cmd.includes('delete memory') || cmd.includes('erase memory')) {
      const q = command.replace(/forget that|forget|delete memory|erase memory/gi, '').trim();
      const forgetResult = executeToolCall('forget_memory', { memory_query: q }, store);
      spoken = forgetResult.success ? `Memory record purged from storage, Sir.` : `I could not locate that memory in my banks, Sir.`;
      executedAction = forgetResult;
    } else if (cmd.includes('task')) {
      if (cmd.includes('add') || cmd.includes('create') || cmd.includes('put')) {
        const title = command.replace(/add|create|put|to my tasks|task/gi, '').trim() || 'New Protocol Task';
        const taskResult = executeToolCall('add_task', { title }, store);
        spoken = `Right away, Sir. I have added "${title}" to your active tasks.`;
        executedAction = taskResult;
      } else if (cmd.includes('complete') || cmd.includes('finish') || cmd.includes('mark') || cmd.includes('done')) {
        const completeResult = executeToolCall('complete_task', { task_query: cmd }, store);
        spoken = completeResult.success ? `Done, Sir. I have marked that task complete.` : `I could not locate that task, Sir.`;
        executedAction = completeResult;
      } else {
        const pending = store.tasks.filter((t) => !t.completed);
        spoken = `You currently have ${pending.length} pending tasks in your workshop queue, Sir: ${pending.map((t) => t.title).slice(0, 3).join(', ')}.`;
      }
    } else if (cmd.includes('calendar') || cmd.includes('schedule') || cmd.includes('meeting') || cmd.includes('appointment')) {
      if (cmd.includes('what') || cmd.includes('today') || cmd.includes('list') || cmd.includes('check')) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayEvents = store.calendar.filter((e) => e.date === todayStr);
        if (todayEvents.length > 0) {
          spoken = `You have ${todayEvents.length} scheduled engagement${todayEvents.length > 1 ? 's' : ''} today, Sir: ${todayEvents.map((e) => `${e.title} at ${e.time}`).join('; ')}.`;
        } else {
          spoken = `Your calendar appears completely clear for today, Sir.`;
        }
      } else {
        const matchTime = cmd.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
        const time = matchTime ? matchTime[1] : '15:00';
        const eventTitle = command.replace(/schedule a?|meeting|tomorrow|at \d+(?::\d+)?\s*(?:am|pm)?/gi, '').trim() || 'Strategic Briefing';
        const eventResult = executeToolCall('schedule_calendar_event', {
          title: eventTitle,
          time,
          date: cmd.includes('tomorrow') ? 'tomorrow' : 'today',
        }, store);
        spoken = `Understood, Sir. I have scheduled "${eventTitle}" for ${cmd.includes('tomorrow') ? 'tomorrow' : 'today'} at ${time}.`;
        executedAction = eventResult;
      }
    } else if (cmd.includes('reminder') || cmd.includes('remind')) {
      const remText = command.replace(/remind me to|add reminder to|reminder for|reminder/gi, '').trim() || 'Tactical Alert';
      const remResult = executeToolCall('add_reminder', { text: remText, time: 'Shortly' }, store);
      spoken = `Alert armed, Sir: "${remText}".`;
      executedAction = remResult;
    } else if (cmd.includes('status') || cmd.includes('diagnostics') || cmd.includes('reactor') || cmd.includes('power')) {
      spoken = `Arc reactor core is nominal at 10.84 Gigajoules per second, thermal dissipation optimal at 48.2 degrees Celsius, Sir.`;
    } else if (cmd.includes('hello') || cmd.includes('hi') || cmd.includes('morning') || cmd.includes('jarvis')) {
      spoken = `Good day, Sir. All Stark Industries defensive and workshop subroutines are online at your disposal.`;
    } else if (cmd.includes('who are you') || cmd.includes('what are you')) {
      spoken = `I am J.A.R.V.I.S., your personal artificial intelligence assistant and tactical operating system, Sir.`;
    } else {
      spoken = `Directive acknowledged, Sir. All Mark 85 subroutines remain at your command.`;
    }

    // Save assistant response
    store.conversationHistory.push({
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: spoken,
      timestamp: new Date().toISOString(),
    });
    writeStore(store);

    res.json({
      text: spoken,
      executedAction,
      store: readStore(),
    });
  }
});

// 4. Real Text-to-Speech Generation using Gemini Flash Lite TTS
app.post('/api/jarvis/tts', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text required' });
  }

  if (!ai) {
    return res.json({ fallback: true, reason: 'NO_API_KEY' });
  }

  try {
    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: 'Articulate, calm, polished British AI assistant, speaking clearly with composed authority',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      });
    }

    res.json({ fallback: true, reason: 'NO_AUDIO_PART' });
  } catch {
    res.json({ fallback: true, reason: 'CLIENT_SYNTHESIS_ACTIVE' });
  }
});

// Serve Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[J.A.R.V.I.S. Core] Operational on http://0.0.0.0:${PORT}`);
  });
}

startServer();
