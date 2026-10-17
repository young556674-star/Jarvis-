import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import {
  CalendarEvent,
  TaskItem,
  ProjectItem,
  ReminderItem,
  MemoryItem,
  JarvisDataStore,
} from '../types';

export interface UserProfileData {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// User Profile
// -------------------------------------------------------------
export async function syncUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userDocRef);

    const profile: UserProfileData = {
      userId: user.uid,
      email: user.email || 'stark.pilot@starkindustries.com',
      displayName: user.displayName || 'Stark Operator',
      photoURL: user.photoURL || '',
      createdAt: existingSnap.exists()
        ? existingSnap.data()?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Calendar Events
// -------------------------------------------------------------
export async function addFirestoreCalendarEvent(
  userId: string,
  event: CalendarEvent
): Promise<void> {
  const path = `users/${userId}/calendar/${event.id}`;
  try {
    const cleanEvent: CalendarEvent & { userId: string } = {
      ...event,
      userId,
      createdAt: event.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', userId, 'calendar', event.id), cleanEvent);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteFirestoreCalendarEvent(
  userId: string,
  eventId: string
): Promise<void> {
  const path = `users/${userId}/calendar/${eventId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'calendar', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Tasks
// -------------------------------------------------------------
export async function addFirestoreTask(userId: string, task: TaskItem): Promise<void> {
  const path = `users/${userId}/tasks/${task.id}`;
  try {
    const cleanTask: TaskItem & { userId: string } = {
      ...task,
      userId,
      createdAt: task.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', userId, 'tasks', task.id), cleanTask);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleFirestoreTask(
  userId: string,
  taskId: string,
  currentCompleted: boolean
): Promise<void> {
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'tasks', taskId), {
      completed: !currentCompleted,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteFirestoreTask(userId: string, taskId: string): Promise<void> {
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Projects
// -------------------------------------------------------------
export async function addFirestoreProject(
  userId: string,
  project: ProjectItem
): Promise<void> {
  const path = `users/${userId}/projects/${project.id}`;
  try {
    const cleanProj: ProjectItem & { userId: string } = {
      ...project,
      userId,
      createdAt: project.updated_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', userId, 'projects', project.id), cleanProj);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteFirestoreProject(
  userId: string,
  projectId: string
): Promise<void> {
  const path = `users/${userId}/projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'projects', projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Reminders
// -------------------------------------------------------------
export async function addFirestoreReminder(
  userId: string,
  reminder: ReminderItem
): Promise<void> {
  const path = `users/${userId}/reminders/${reminder.id}`;
  try {
    const cleanRem: ReminderItem & { userId: string } = {
      ...reminder,
      userId,
      createdAt: reminder.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', userId, 'reminders', reminder.id), cleanRem);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteFirestoreReminder(
  userId: string,
  reminderId: string
): Promise<void> {
  const path = `users/${userId}/reminders/${reminderId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'reminders', reminderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Long-Term Memories
// -------------------------------------------------------------
export async function addFirestoreMemory(
  userId: string,
  memory: MemoryItem
): Promise<void> {
  const path = `users/${userId}/memories/${memory.id}`;
  try {
    const cleanMem: MemoryItem & { userId: string } = {
      ...memory,
      userId,
      createdAt: memory.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', userId, 'memories', memory.id), cleanMem);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteFirestoreMemory(
  userId: string,
  memoryId: string
): Promise<void> {
  const path = `users/${userId}/memories/${memoryId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'memories', memoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Real-Time Subscriptions & Default Data Seeding
// -------------------------------------------------------------
export function subscribeToUserData(
  userId: string,
  onDataUpdate: (updater: (prev: JarvisDataStore) => JarvisDataStore) => void,
  initialFallbackStore: JarvisDataStore
): () => void {
  const unsubscribers: (() => void)[] = [];

  // 1. Calendar
  const calPath = `users/${userId}/calendar`;
  const unsubCal = onSnapshot(
    collection(db, 'users', userId, 'calendar'),
    (snapshot) => {
      if (snapshot.empty && initialFallbackStore.calendar.length > 0) {
        // Seed initial Stark calendar
        initialFallbackStore.calendar.forEach((item) => {
          addFirestoreCalendarEvent(userId, item).catch(() => {});
        });
      } else {
        const events: CalendarEvent[] = [];
        snapshot.forEach((docSnap) => {
          events.push(docSnap.data() as CalendarEvent);
        });
        // Sort chronologically
        events.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
        onDataUpdate((prev) => ({ ...prev, calendar: events }));
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, calPath);
    }
  );
  unsubscribers.push(unsubCal);

  // 2. Tasks
  const taskPath = `users/${userId}/tasks`;
  const unsubTask = onSnapshot(
    collection(db, 'users', userId, 'tasks'),
    (snapshot) => {
      if (snapshot.empty && initialFallbackStore.tasks.length > 0) {
        // Seed initial Stark tasks
        initialFallbackStore.tasks.forEach((item) => {
          addFirestoreTask(userId, item).catch(() => {});
        });
      } else {
        const tasks: TaskItem[] = [];
        snapshot.forEach((docSnap) => {
          tasks.push(docSnap.data() as TaskItem);
        });
        tasks.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        onDataUpdate((prev) => ({ ...prev, tasks }));
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, taskPath);
    }
  );
  unsubscribers.push(unsubTask);

  // 3. Projects
  const projPath = `users/${userId}/projects`;
  const unsubProj = onSnapshot(
    collection(db, 'users', userId, 'projects'),
    (snapshot) => {
      if (snapshot.empty && initialFallbackStore.projects.length > 0) {
        initialFallbackStore.projects.forEach((item) => {
          addFirestoreProject(userId, item).catch(() => {});
        });
      } else {
        const projects: ProjectItem[] = [];
        snapshot.forEach((docSnap) => {
          projects.push(docSnap.data() as ProjectItem);
        });
        onDataUpdate((prev) => ({ ...prev, projects }));
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, projPath);
    }
  );
  unsubscribers.push(unsubProj);

  // 4. Reminders
  const remPath = `users/${userId}/reminders`;
  const unsubRem = onSnapshot(
    collection(db, 'users', userId, 'reminders'),
    (snapshot) => {
      if (snapshot.empty && initialFallbackStore.reminders.length > 0) {
        initialFallbackStore.reminders.forEach((item) => {
          addFirestoreReminder(userId, item).catch(() => {});
        });
      } else {
        const reminders: ReminderItem[] = [];
        snapshot.forEach((docSnap) => {
          reminders.push(docSnap.data() as ReminderItem);
        });
        onDataUpdate((prev) => ({ ...prev, reminders }));
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, remPath);
    }
  );
  unsubscribers.push(unsubRem);

  // 5. Memories
  const memPath = `users/${userId}/memories`;
  const unsubMem = onSnapshot(
    collection(db, 'users', userId, 'memories'),
    (snapshot) => {
      if (snapshot.empty && initialFallbackStore.memories.length > 0) {
        initialFallbackStore.memories.forEach((item) => {
          addFirestoreMemory(userId, item).catch(() => {});
        });
      } else {
        const memories: MemoryItem[] = [];
        snapshot.forEach((docSnap) => {
          memories.push(docSnap.data() as MemoryItem);
        });
        memories.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        onDataUpdate((prev) => ({ ...prev, memories }));
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, memPath);
    }
  );
  unsubscribers.push(unsubMem);

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
