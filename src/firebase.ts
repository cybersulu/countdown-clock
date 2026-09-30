import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { AlarmSoundType } from './utils/audio';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const BOOTSTRAP_ADMIN_EMAIL = 'pete.teoh@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on startup as required by skill
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

export interface CountdownEvent {
  id: string;
  title: string;
  description?: string;
  targetDate: string; // ISO String
  category?: string;
  color?: string;
  alarmSound: AlarmSoundType;
  alarmVolume?: number;
  alarmEnabled: boolean;
  isPinned?: boolean;
  createdByUid: string;
  createdByEmail: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AllowlistEntry {
  id: string;
  email: string;
  role: 'admin' | 'creator';
  addedBy?: string;
  addedAt: string;
}

// Auth helpers
export async function signInWithGoogle(): Promise<User> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Subscriptions
export function subscribeToEvents(
  onData: (events: CountdownEvent[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'events';
  try {
    const q = query(collection(db, path), orderBy('targetDate', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const events: CountdownEvent[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<CountdownEvent, 'id'>;
          events.push({
            id: docSnap.id,
            ...data,
          });
        });
        onData(events);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (wrapped) {
          if (onError) onError(wrapped as Error);
        }
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeToAllowlist(
  onData: (entries: AllowlistEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!auth.currentUser) {
    onData([]);
    return () => {};
  }

  const path = 'allowlist';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const entries: AllowlistEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<AllowlistEntry, 'id'>;
          entries.push({
            id: docSnap.id,
            ...data,
          });
        });
        onData(entries);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (wrapped) {
          if (onError) onError(wrapped as Error);
        }
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Event Actions
export async function createCountdownEvent(
  eventData: Omit<CountdownEvent, 'id' | 'createdByUid' | 'createdByEmail' | 'createdAt'>
): Promise<string> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('You must be signed in with a Google account to create an event.');
  }

  const path = 'events';
  const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const nowIso = new Date().toISOString();

  const payload: Omit<CountdownEvent, 'id'> = {
    title: eventData.title.trim().slice(0, 100),
    description: eventData.description ? eventData.description.trim().slice(0, 500) : '',
    targetDate: eventData.targetDate,
    category: eventData.category ? eventData.category.trim().slice(0, 40) : 'General',
    color: eventData.color || 'cyan',
    alarmSound: eventData.alarmSound || 'chime',
    alarmVolume: typeof eventData.alarmVolume === 'number' ? eventData.alarmVolume : 0.8,
    alarmEnabled: eventData.alarmEnabled ?? true,
    isPinned: eventData.isPinned ?? false,
    createdByUid: user.uid,
    createdByEmail: user.email,
    createdAt: nowIso,
  };

  try {
    await setDoc(doc(db, path, eventId), payload);
    return eventId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${eventId}`);
  }
}

export async function updateCountdownEvent(
  eventId: string,
  updates: Partial<Omit<CountdownEvent, 'id' | 'createdByUid' | 'createdByEmail' | 'createdAt'>>
): Promise<void> {
  const path = `events/${eventId}`;
  const nowIso = new Date().toISOString();

  const cleanUpdates: Record<string, unknown> = {
    updatedAt: nowIso,
  };

  if (updates.title !== undefined) cleanUpdates.title = updates.title.trim().slice(0, 100);
  if (updates.description !== undefined) cleanUpdates.description = updates.description.trim().slice(0, 500);
  if (updates.targetDate !== undefined) cleanUpdates.targetDate = updates.targetDate;
  if (updates.category !== undefined) cleanUpdates.category = updates.category.trim().slice(0, 40);
  if (updates.color !== undefined) cleanUpdates.color = updates.color;
  if (updates.alarmSound !== undefined) cleanUpdates.alarmSound = updates.alarmSound;
  if (updates.alarmVolume !== undefined) cleanUpdates.alarmVolume = updates.alarmVolume;
  if (updates.alarmEnabled !== undefined) cleanUpdates.alarmEnabled = updates.alarmEnabled;
  if (updates.isPinned !== undefined) cleanUpdates.isPinned = updates.isPinned;

  try {
    await updateDoc(doc(db, 'events', eventId), cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCountdownEvent(eventId: string): Promise<void> {
  const path = `events/${eventId}`;
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Allowlist management
export async function addEmailToAllowlist(email: string, role: 'admin' | 'creator' = 'creator'): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');

  const cleanEmail = email.trim().toLowerCase();
  const docId = cleanEmail;
  const path = `allowlist/${docId}`;

  try {
    await setDoc(doc(db, 'allowlist', docId), {
      email: cleanEmail,
      role,
      addedBy: user.email || user.uid,
      addedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeEmailFromAllowlist(docId: string): Promise<void> {
  const path = `allowlist/${docId}`;
  try {
    await deleteDoc(doc(db, 'allowlist', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
