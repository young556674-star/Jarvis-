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

// Initial Seed Data
const defaultData = {
  calendar: [
    {
      id: 'cal-1',
      title: 'Flight Test Mark 85 Supersonic Thrusters',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      duration: '45 mins',
      notes: 'Testing high-altitude thermal dissipators above Malibu.',
      category: 'Armor Protocol',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cal-2',
      title: 'Stark Industries Board Review: Clean Energy Grid',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '10:30',
      duration: '60 mins',
      notes: 'Reviewing city-wide arc reactor distribution efficiency.',
      category: 'Corporate',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cal-3',
      title: 'Avengers Protocol Briefing with Col. Rhodes',
      date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      time: '16:00',
      duration: '30 mins',
      notes: 'Tactical satellite realignment status report.',
      category: 'Defense',
      created_at: new Date().toISOString(),
    },
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Calibrate arc reactor palladium core harmonics',
      completed: false,
      priority: 'high',
      category: 'Engineering',
      dueDate: 'Today',
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Synthesize Vibranium-titanium alloy batch #42',
      completed: false,
      priority: 'high',
      category: 'Workshop',
      dueDate: 'Tomorrow',
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: 'Update JARVIS neural encryption firewall subroutines',
      completed: true,
      priority: 'medium',
      category: 'Security',
      dueDate: 'Completed',
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-4',
      title: 'Order composite carbon fiber weave for repulsor gauntlets',
      completed: false,
      priority: 'low',
      category: 'Logistics',
      dueDate: 'This Week',
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
    {
      id: 'proj-4',
      title: 'CELLULAR NANOBOT REPAIR MATRIX',
      description: 'Autonomous micro-machinery for rapid biological trauma recovery.',
      progress: 65,
      status: 'active',
      tag: 'Bio-Medical',
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
      text: "Dinner reservation with Pepper at 20:00 at Nobu Malibu",
      time: '20:00 Today',
      priority: 'high',
      dismissed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'rem-3',
      text: 'Renew orbital satellite telemetry downlink lease',
      time: 'Tomorrow 09:00',
      priority: 'normal',
      dismissed: false,
      created_at: new Date().toISOString(),
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
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading store:', err);
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
    console.error('Error writing store:', err);
  }
}

// Function Declarations for Gemini Tool Calling
const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'schedule_calendar_event',
    description: 'Schedule a new event, meeting, or appointment in Tony Stark’s calendar.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Title or subject of the event' },
        date: { type: Type.STRING, description: 'Date in YYYY-MM-DD or human format like Tomorrow, Today' },
        time: { type: Type.STRING, description: 'Time of day e.g. 15:00, 3 PM' },
        duration: { type: Type.STRING, description: 'Duration e.g. 45 mins, 1 hour' },
        notes: { type: Type.STRING, description: 'Additional details or location' },
        category: { type: Type.STRING, description: 'Category e.g. Armor Protocol, Corporate, Personal, Workshop' },
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
    case 'schedule_calendar_event': {
      let eventDate = args.date;
      if (!eventDate || eventDate.toLowerCase() === 'today') {
        eventDate = new Date().toISOString().split('T')[0];
      } else if (eventDate.toLowerCase() === 'tomorrow') {
        eventDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      }

      const newEvent = {
        id: `cal-${Date.now()}`,
        title: args.title,
        date: eventDate,
        time: args.time || '12:00',
        duration: args.duration || '60 mins',
        notes: args.notes || 'Scheduled via J.A.R.V.I.S. voice protocol.',
        category: args.category || 'Workshop Protocol',
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
      const initialCount = store.calendar.length;
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

// 3. Central JARVIS Command Processor (Voice / Typed Command)
app.post('/api/jarvis/command', async (req, res) => {
  const { command } = req.body;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command text is required.' });
  }

  const store = readStore();
  const systemInstruction = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), Tony Stark's sophisticated, suave, loyal AI butler and tactical operating system.
Speak in character: calm, witty, refined, respectful (address user as "Sir" or as Tony), and distinctly British in tone.
Keep answers concise, direct, and conversational (1 to 2 sentences) because your words are spoken aloud through synthetic audio.
CRITICAL INSTRUCTIONS:
1. When asked to schedule an event, add a task, mark a task complete, list reminders, create a project, or query schedule/diagnostics, ALWAYS execute the appropriate tool function.
2. Never claim an action succeeded unless the function executed successfully. If details are missing (e.g. time for an event), ask a polite follow-up.
3. Current system time reference: ${new Date().toLocaleString()}. Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;

  // Fallback response if Gemini AI is not initialized
  if (!ai) {
    // Provide intelligent local regex handling for basic commands if no API key is available
    const cmd = command.toLowerCase();
    let spoken = "I am online and at your service, Sir. However, the Gemini API key has not been configured in your Secrets panel yet.";
    let executedAction = null;

    if (cmd.includes('task')) {
      if (cmd.includes('add') || cmd.includes('create')) {
        const title = command.replace(/add|create|to my tasks|task/gi, '').trim() || 'New Protocol Task';
        const taskResult = executeToolCall('add_task', { title }, store);
        spoken = `Right away, Sir. I have added "${title}" to your active tasks.`;
        executedAction = taskResult;
      } else if (cmd.includes('complete') || cmd.includes('mark') || cmd.includes('finish') || cmd.includes('done')) {
        const completeResult = executeToolCall('complete_task', { task_query: cmd }, store);
        spoken = completeResult.success ? `Done, Sir. I have marked that task complete.` : `I could not locate that task, Sir.`;
        executedAction = completeResult;
      }
    } else if (cmd.includes('schedule') || cmd.includes('meeting') || cmd.includes('calendar')) {
      const matchTime = cmd.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
      const time = matchTime ? matchTime[1] : '15:00';
      const eventResult = executeToolCall('schedule_calendar_event', {
        title: command.replace(/schedule a?|meeting|tomorrow|at \d+/gi, '').trim() || 'Tactical Meeting',
        time,
        date: cmd.includes('tomorrow') ? 'tomorrow' : 'today',
      }, store);
      spoken = `Understood, Sir. Scheduled for ${time}.`;
      executedAction = eventResult;
    } else if (cmd.includes('status') || cmd.includes('diagnostics') || cmd.includes('reactor')) {
      spoken = `Arc reactor core is functioning at 10.84 Gigajoules per second, thermal parameters nominal at 48 degrees Celsius, Sir.`;
    }

    return res.json({
      text: spoken,
      executedAction,
      store: readStore(),
    });
  }

  // Helper to query Gemini with model fallback
  const invokeGemini = async (modelName: string) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: command,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations }],
        temperature: 0.7,
      },
    });
  };

  try {
    let response: any = null;
    let selectedModel = 'gemini-3.1-flash-lite';

    try {
      // Primary: gemini-3.1-flash-lite (high throughput, dedicated quota pool)
      response = await invokeGemini('gemini-3.1-flash-lite');
    } catch {
      // Secondary fallback model
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
        const followUp = await ai.models.generateContent({
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
            temperature: 0.7,
          },
        });
        finalSpeech = followUp.text || `Right away, Sir. ${toolResult.message || 'Operation executed.'}`;
      } catch {
        finalSpeech = `Right away, Sir. ${toolResult.message || 'Operation executed.'}`;
      }
    } else {
      finalSpeech = response?.text || 'At your service, Sir.';
    }

    res.json({
      text: finalSpeech.trim(),
      executedTool,
      store: readStore(),
    });
  } catch {
    // Graceful local tactical parser without printing raw 429 quota JSON to console
    const cmd = command.toLowerCase();
    let spoken = "Right away, Sir. Directive processed.";
    let executedAction = null;

    if (cmd.includes('task')) {
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
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Fenrir is deep, authoritative, and crisp
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
