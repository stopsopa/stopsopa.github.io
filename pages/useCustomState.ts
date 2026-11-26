/**
 * Universal "custom state" interface: storage of tree like structure, scoped per user and per section.
 *
 * This file is only the contract (interfaces below) + one line choosing the implementation.
 * Components should import only this file and should never call anything specific to the underlying storage.
 *
 * Current implementation: pages/databases/firebase/useFirebase.ts
 *
 * To change the underlying storage:
 * 1. write hook with signature CustomStateImplementation (so it returns UseCustomStateReturn)
 * 2. assign it to `implementation` below
 * No component using useCustomState should require any change.
 *
 * Lifecycle:
 * 1. hook is mounted -> implementation drives authentication on its own (popups, tokens, whatever it needs)
 * 2. ready: true -> all methods are ready to use, username and userId are defined
 * 3. signOut() -> session destroyed, ready: false
 * 4. signIn() -> go to 1
 *
 * Example:
 *
 *   const { ready, error, username, userId, get, set, push, del, signIn, signOut } = useCustomState({
 *     section: "my_namespace",
 *   });
 *
 *   useEffect(() => {
 *     if (ready) {
 *       loadData();
 *     }
 *   }, [ready]);
 *
 *   if (error) return <pre>{JSON.stringify(error, null, 4)}</pre>;
 *   if (!ready) return <div>Connecting...</div>;
 */
import useFirebase from "./databases/firebase/useFirebase.ts";

/**
 * Options for useCustomState hook
 */
export interface UseCustomStateOptions {
  // root of the tree for given project - all keys passed to get/set/push/del are relative to it
  section: string;
}

/**
 * Path in the tree relative to the section: "todos/abc" or ["todos", "abc"].
 * Not specified means the root of the section.
 */
export type StateKey = string | string[];

/**
 * Common payload structure for set/push operations
 */
export interface StateMutationOptions<T = any> {
  key?: StateKey;
  data?: T;
}

/**
 * Return type of useCustomState hook - the complete contract every implementation has to fulfil
 */
export interface UseCustomStateReturn {
  // false until authentication is finished, true when all methods below are ready to interact with
  ready: boolean;
  // false when there is no error
  error: any;
  // human readable name of authenticated user (in firebase implementation: email), undefined when not ready
  username: string | undefined;
  // stable unique identifier of authenticated user, undefined when not ready
  userId: string | undefined;
  // write (overwrite) data under the key
  set: <T = any>(opt?: StateMutationOptions<T>) => Promise<void>;
  // read data (single value or whole subtree) from under the key
  get: <T = any>(key?: StateKey) => Promise<T>;
  // remove the key with the whole subtree
  del: (key?: StateKey) => Promise<void>;
  // add data as new child of the key, returns generated key of that child (use it like `${key}/${returned}`)
  push: <T = any>(opt?: StateMutationOptions<T>) => Promise<string>;
  // start authentication again (after signOut or after error), flips ready to true when done
  signIn: () => Promise<void>;
  // destroy the session, flips ready to false
  signOut: () => Promise<void>;
}

/**
 * Signature every implementation of the custom state has to have
 */
export type CustomStateImplementation = (opt: UseCustomStateOptions) => UseCustomStateReturn;

// the only place which decides what storage is used
const implementation: CustomStateImplementation = useFirebase;

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

  return implementation({ section });
}
