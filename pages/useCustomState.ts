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
 * Typing: pass type of the whole tree stored in the section - useCustomState<MyState>().
 * Then get/set/push are typed by the key ("a/b" and ["a", "b"] forms both work):
 *
 *   get()                                 -> MyState | null
 *   get("todos")                          -> Record<string, Todo> | undefined | null
 *   get(`todos/${id}`)                    -> Todo | null
 *   set({ key: ["todos", id], data })     -> data has to be Todo
 *   push({ key: "todos", data })          -> data has to be Todo (element of the collection)
 *
 * When key is not known in compile time (plain `string` variable) types fall back to `any`.
 * Without <MyState> everything is `any`. In *.jsx files describe the type with JSDoc (see pages/portsregistry/portsregistry.entry.jsx).
 *
 * Example:
 *
 *   interface Todo {
 *     text: string;
 *     done: boolean;
 *   }
 *
 *   interface MyState {
 *     todos?: Record<string, Todo>;
 *   }
 *
 *   const { ready, error, username, userId, get, set, push, del, signIn, signOut } = useCustomState<MyState>({
 *     section: "my_namespace", // unique for each page/service
 *   });
 *
 *   useEffect(() => {
 *     if (ready) {
 *       loadData();
 *     }
 *   }, [ready]);
 *
 *   // shared screen for "signing in / signed out / error" with "Sign in" button: pages/CustomStateGate.tsx
 *   if (error || !ready) return <CustomStateGate ready={ready} error={error} signIn={signIn} />;
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
export type StateKey = string | readonly (string | number)[];

/**
 * Common payload structure for set/push operations
 */
export interface StateMutationOptions<T = any> {
  key?: StateKey;
  data?: T;
}

// resolves type under the key given as string: StateValueByString<S, "a/b"> -> S["a"]["b"], unknown path -> any
type StateValueByString<S, K extends string> = K extends `${infer H}/${infer R}`
  ? H extends keyof NonNullable<S>
    ? StateValueByString<NonNullable<S>[H], R>
    : any
  : K extends keyof NonNullable<S>
  ? NonNullable<S>[K]
  : any;

// resolves type under the key given as array: StateValueByArray<S, ["a", "b"]> -> S["a"]["b"], unknown path -> any
type StateValueByArray<S, K extends readonly unknown[]> = K extends readonly []
  ? S
  : K extends readonly [infer H, ...infer R]
  ? H extends keyof NonNullable<S>
    ? StateValueByArray<NonNullable<S>[H], R>
    : any
  : any;

/**
 * Type of the value stored under key K in the tree of type S.
 * No key -> S (whole section). Key not known in compile time -> any.
 */
export type StateValue<S, K> = [K] extends [undefined]
  ? S
  : K extends string
  ? StateValueByString<S, K>
  : K extends readonly unknown[]
  ? StateValueByArray<S, K>
  : any;

/**
 * Type of single element of the collection stored under key K - that is what push() adds.
 */
export type StateItem<S, K> = NonNullable<StateValue<S, K>> extends Record<string, infer V> ? V : any;

/**
 * Return type of useCustomState hook - the complete contract every implementation has to fulfil.
 * S is the type of the whole tree stored in the section.
 */
export interface UseCustomStateReturn<S = any> {
  // false until authentication is finished, true when all methods below are ready to interact with
  ready: boolean;
  // false when there is no error
  error: any;
  // human readable name of authenticated user (in firebase implementation: email), undefined when not ready
  username: string | undefined;
  // stable unique identifier of authenticated user, undefined when not ready
  userId: string | undefined;
  // write (overwrite) data under the key
  set: <const K extends StateKey | undefined = undefined>(opt?: { key?: K; data?: StateValue<S, K> }) => Promise<void>;
  // read data (single value or whole subtree) from under the key, null when nothing is there
  get: <const K extends StateKey | undefined = undefined>(key?: K) => Promise<StateValue<S, K> | null>;
  // remove the key with the whole subtree
  del: (key?: StateKey) => Promise<void>;
  // add data as new child of the key, returns generated key of that child (use it like `${key}/${returned}`)
  push: <const K extends StateKey | undefined = undefined>(opt?: {
    key?: K;
    data?: StateItem<S, K>;
  }) => Promise<string>;
  // start authentication again (after signOut or after error), flips ready to true when done
  signIn: () => Promise<void>;
  // destroy the session, flips ready to false
  signOut: () => Promise<void>;
}

/**
 * Signature every implementation of the custom state has to have
 */
export type CustomStateImplementation = <S = any>(opt: UseCustomStateOptions) => UseCustomStateReturn<S>;

// the only place which decides what storage is used
const implementation: CustomStateImplementation = useFirebase;

/**
 * This represents universal custom state interface which at the moment is based on firebase
 * but it might be based on anything really what is able to store tree like structures
 * as long as it provides basic methods:
 * set, get, del
 *
 * S - type of the whole tree stored in the section, every page/service should define and pass its own
 */
export default function useCustomState<S = any>({ section }: UseCustomStateOptions): UseCustomStateReturn<S> {
  if (typeof section !== "string") {
    throw new Error(`useCustomState error: section is not a string`);
  }

  return implementation<S>({ section });
}
