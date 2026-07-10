import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "G-"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

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
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface VerificationData {
  userId: string;
  promoCode: string;
  receiptImage: string | null;
  profileImage: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function saveVerification(
  userId: string,
  promoCode: string,
  receiptBase64: string | null,
  profileBase64: string | null
): Promise<void> {
  const path = `verifications/${userId}`;
  try {
    await setDoc(doc(db, 'verifications', userId), {
      userId,
      promoCode,
      receiptImage: receiptBase64,
      profileImage: profileBase64,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
