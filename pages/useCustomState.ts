// @ts-ignore
import useFirebase from "./databases/firebase/useFirebase.js";

/**
 * Options for useCustomState hook
 */
export interface UseCustomStateOptions {
  section: string;
}

/**
 * Common payload structure for set/push operations
 */
export interface StateMutationOptions<T = any> {
  key: string | string[];
  data: T;
}

/**
 * Return type of useCustomState hook
 */
export interface UseCustomStateReturn {
  id: string | undefined;
  error: any;
  set: <T = any>(opt: StateMutationOptions<T>) => Promise<void>;
  get: <T = any>(key: string | string[]) => Promise<T>;
  del: (key: string | string[]) => Promise<void>;
  push: <T = any>(opt: StateMutationOptions<T>) => Promise<string>;
  getroot: (key?: string | string[]) => Promise<string>;
  expirationData: () => any;
  reCreateSession: () => Promise<void>;
  signOut: () => Promise<void>;
  [key: string]: any;
}

/**
 * This represents universal custom state interface which at the moment is based on firebase
 * but it might be based on anything really what is able to store tree like structures
 * as long as it provides basic methods:
 * set, get, del
 */
export default function useCustomState({ section }: UseCustomStateOptions): UseCustomStateReturn {
  if (typeof section !== "string") {
    throw new Error(`useCustomState error: section is not a string`);
  }

  const { firebase, user, ...rest } = useFirebase({
    section,
  });

  (rest as any).id = user;

  return rest as UseCustomStateReturn;
}
