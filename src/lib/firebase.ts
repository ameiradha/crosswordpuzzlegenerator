import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  getDocFromServer,
  type Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProgress, CrosswordPuzzle } from '../types/crossword';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Warning/Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test initial connection as per skill instructions
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client appears offline, will operate in local-first mode.");
    }
  }
}

// Auth Helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In failed:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Sign Out failed:', error);
    throw error;
  }
}

// Cloud Sync Helpers
export async function saveProgressToCloud(userId: string, puzzleId: string, progress: UserProgress): Promise<boolean> {
  const path = `users/${userId}/progress/${puzzleId}`;
  try {
    const docRef = doc(db, 'users', userId, 'progress', puzzleId);
    await setDoc(docRef, {
      userId,
      puzzleId,
      answers: progress.answers,
      completed: progress.completed,
      elapsedSeconds: progress.elapsedSeconds,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function fetchProgressFromCloud(userId: string, puzzleId: string): Promise<UserProgress | null> {
  const path = `users/${userId}/progress/${puzzleId}`;
  try {
    const docRef = doc(db, 'users', userId, 'progress', puzzleId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProgress;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function savePuzzleToCloud(puzzle: CrosswordPuzzle, userId: string, userName: string): Promise<boolean> {
  const path = `puzzles/${puzzle.id}`;
  try {
    const docRef = doc(db, 'puzzles', puzzle.id);
    await setDoc(docRef, {
      id: puzzle.id,
      title: puzzle.title,
      authorId: userId,
      authorName: userName || 'Anonymous',
      gridData: puzzle.layout,
      rawInput: puzzle.rawInput,
      createdAt: puzzle.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function fetchUserPuzzlesFromCloud(userId: string): Promise<CrosswordPuzzle[]> {
  const path = 'puzzles';
  try {
    const q = query(collection(db, 'puzzles'), where('authorId', '==', userId));
    const snap = await getDocs(q);
    const results: CrosswordPuzzle[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      results.push({
        id: data.id,
        title: data.title,
        authorId: data.authorId,
        authorName: data.authorName,
        layout: data.gridData,
        rawInput: data.rawInput,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        isCustom: true
      });
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
