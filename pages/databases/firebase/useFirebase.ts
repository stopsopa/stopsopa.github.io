/**
 * This script is not what end user should use.
 * The main interface is implemented in pages/useCustomState.ts in this project
 * Use rather pages/useCustomState.ts as instructed in pages/databases/firebase/USAGE.md
 */


import { useEffect, useState } from "react";

// @ts-ignore
import log from "inspc";

// @ts-ignore
import se from "nlab/serializeError";

const th = (msg: string) => new Error(`useFirebase hook error: ${msg}`);

const fix = `
useEffect(() => {

  if (id) {

    // initialise everything here
    refreshList();
  }

}, [id]);            
`;

function decodeJwtPayload(token: string | null | undefined): any {
  if (typeof token === "string" && token.trim()) {
    const segments = token.split(".");

    // console.log("expirationData segments", segments);

    if (segments.length === 3) {
      let json: any;

      try {
        json = JSON.parse(atob(segments[1]));
      } catch (e) {
        console.log("expirationData expirationData decoding json error: ", e);
      }

      if (json) {
        json._exp = new Date(json.exp * 1000);

        json._minutes_left = parseInt(String((json.exp - new Date().getTime() / 1000) / 60), 10);

        return json;
      }
    }
  }
}

function logCurrentToken(comment = "", token?: string | null) {
  if (!token) {
    token = localStorage.getItem("idToken");
  }

  console.log("localStorage jwt 'idToken' payload", comment, JSON.stringify(decodeJwtPayload(token), null, 4));
}

let autoTryToReAuthenticate = true;

declare global {
  interface Window {
    firebaseCoreEntry?: () => Promise<any>;
    __refresh?: () => Promise<void>;
    expirationData?: () => any;
  }
}

const getFirebaseCoreEntry = () => {
  if (typeof window.firebaseCoreEntry !== "function") {
    throw new ReferenceError("firebaseCoreEntry is not defined");
  }
  return window.firebaseCoreEntry();
};

export interface UseFirebaseOptions {
  section: string;
}

export interface FirebaseMutationOptions<T = any> {
  data?: T;
  key?: string | string[];
}

export interface UseFirebaseReturn {
  firebase: boolean;
  error: any;
  user: string | undefined;
  set: <T = any>(opt?: FirebaseMutationOptions<T>) => Promise<void>;
  get: <T = any>(key?: string | string[]) => Promise<T>;
  del: (key?: string | string[]) => Promise<void>;
  push: <T = any>(opt?: FirebaseMutationOptions<T>) => Promise<string>;
  getroot: (key?: string | string[]) => Promise<string>;
  expirationData: () => any;
  reCreateSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * to see how to use this hook look for firebase.entry.jsx
 *
 * Read more about API: https://firebase.google.com/docs/reference/js
 */
export default function useFirebase({ section }: UseFirebaseOptions): UseFirebaseReturn {
  const [firebase, setFirebase] = useState(false);

  const [error, setError] = useState<any>(false);

  const [user, setUser] = useState<string | undefined>();

  async function reCreateSession(): Promise<void> {
    try {
      const {
        auth: { getAuth, signInWithPopup, GoogleAuthProvider, signInWithCredential, signOut, getIdToken },
      } = await getFirebaseCoreEntry();

      const auth = getAuth();

      // auth.settings.appVerificationDisabledForTesting = true;
      // auth.settings.sessionDuration = 15; // 15 seconds

      const provider = new GoogleAuthProvider();

      // make security rules for database like this
      // {
      //   "rules": {
      //     "users": {
      //       "$email": {
      //         ".read": true,
      //         ".write": "$email === auth.token.email.replace('.', ',')",
      //       }
      //     }
      //   }
      // }

      // {
      //   "rules": {
      //     "users": {
      //       "$email": {
      //         ".read": "$email === auth.token.email.replace('.', ',')",
      //           ".write": "$email === auth.token.email.replace('.', ',')",
      //       }
      //     }
      //   }
      // }

      let idToken = localStorage.getItem("idToken");

      let accessToken = localStorage.getItem("accessToken");

      async function set() {
        try {
          setFirebase(firebase);

          setError(false);

          const processedUser = auth.currentUser.email.replace(/\./g, ",");

          console.log("current user", auth.currentUser, "processedUser: ", processedUser);

          setUser(processedUser);

          if (idToken) {
            logCurrentToken("current");

            window.__refresh = async () => {
              // const idToken = localStorage.getItem("idToken");

              // console.log("expirationData token", token);

              // if (typeof token === "string" && token.trim()) {
              //   const segments = token.split(".");
              //
              //   console.log("expirationData segments", segments);
              //
              //   if (segments.length === 3) {
              //     let json;
              //
              //     try {
              //       json = JSON.parse(atob(segments[1]));
              //     } catch (e) {
              //       console.log("expirationData expirationData decoding json error: ", e);
              //     }
              //
              //     if (json) {
              //       json._exp = new Date(json.exp * 1000);
              //
              //       json._minutes_left = parseInt((json.exp - new Date().getTime() / 1000) / 60, 10);
              //
              //       return json;
              //     }
              //   }
              // }
              //
              // console.log("expirationData", "no data");

              const token = await getIdToken(auth.currentUser, true);

              logCurrentToken("before");

              localStorage.setItem("idToken", token);

              logCurrentToken("after");
            };
          }
        } catch (e: any) {
          e.customMessage = ">>>>>>>>>>Origin: set() method<<<<<<<<<<<<";

          throw e;
        }
      }

      log.dump({
        firebase_first: auth.currentUser,
      });

      if (!auth.currentUser && idToken && accessToken) {
        try {
          log("firebase_try: signInWithCredential");

          const credential = await GoogleAuthProvider.credential(idToken, accessToken);

          log.dump({
            firebase_credential: credential,
          });

          const result = await signInWithCredential(auth, credential); // https://firebase.google.com/docs/auth/web/account-linking#web-version-9_5

          log.dump({
            firebase_mode: "signInWithCredential",
            user: result.user,
          });
        } catch (e: any) {
          log("firebase_catch: signInWithCredential", se(e));

          setError({
            error: {
              mode: "signInWithCredential -> signOut()",
              e: se(e),
              user: auth.currentUser,
              truthy: !!auth.currentUser,
            },
          });

          await signOut(auth); // https://firebase.google.com/docs/auth/web/google-signin#web-version-9_10
        }
      }

      log.dump({
        "auth.currentUser, before second method": auth.currentUser,
      });

      if (auth.currentUser) {
        log("firebase_signInWithCredential success, trigger set()");
      } else {
        log("try: signInWithPopup");

        const result = await signInWithPopup(auth, provider); // https://firebase.google.com/docs/auth/web/google-signin#web-version-8_4

        const credential = GoogleAuthProvider.credentialFromResult(result);

        idToken = credential.idToken;

        accessToken = credential.accessToken;

        var user = result.user;

        log.dump({
          mode: "signInWithPopup",
          idToken,
          accessToken,
          user,
          result,
        });

        if (idToken) {
          localStorage.setItem("idToken", idToken);
        }

        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
        }
      }

      await set();
    } catch (e: any) {
      log("catch: signInWithPopup", se(e));

      setError({
        error: {
          mode: "signInWithPopup",
          e: se(e),
        },
      });
    }
  }

  useEffect(() => {
    reCreateSession();
  }, []);

  async function getroot(key?: string | string[]): Promise<string> {
    if (typeof section !== "string" || !section.trim()) {
      throw th(`getroot: section is not specified`);
    }

    let processedKey = key;
    if (Array.isArray(processedKey)) {
      processedKey = processedKey.join("/");
    }

    // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
    let internalkey = `users/${user}/${section}`;

    if (typeof processedKey === "string") {
      internalkey += "/" + processedKey;
    }

    log.dump({
      firebase_getroot: internalkey,
    });

    return internalkey;
  }

  async function set<T = any>(opt?: FirebaseMutationOptions<T>): Promise<void> {
    let { data = {} as T, key } = { ...opt };

    let internalkey: string | undefined;

    try {
      const {
        firebaseApp,
        database: { getDatabase, ref, set: fbset },
      } = await getFirebaseCoreEntry();

      if (typeof section !== "string" || !section.trim()) {
        throw th(`set: section is not specified`);
      }

      let processedKey = key;
      if (Array.isArray(processedKey)) {
        processedKey = processedKey.join("/");
      }

      // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
      internalkey = `users/${user}/${section}`;

      if (typeof processedKey === "string") {
        internalkey += "/" + processedKey;
      }

      const db = getDatabase(firebaseApp);

      const dbRef = ref(db, internalkey);

      /**
       * https://firebase.google.com/docs/database/web/read-and-write#web-version-9_5
       */
      await fbset(dbRef, data);

      log.dump({
        set: {
          key,
          internalkey,
          data,
          // 'firebase.auth()': firebase.auth()
        },
      });

      autoTryToReAuthenticate = true;
    } catch (e: any) {
      log.dump({
        "set() error:": {
          error: se(e),
          key,
          internalkey,
          data,
          fix,
        },
      });

      setUser(undefined);

      if (autoTryToReAuthenticate) {
        autoTryToReAuthenticate = false;

        await reCreateSession();

        console.log("bf");

        await new Promise((res) => setTimeout(res, 1000, undefined));

        console.log("af");

        return await set(opt);
      }

      throw e;
    }
  }

  async function push<T = any>(opt?: FirebaseMutationOptions<T>): Promise<string> {
    console.log("push...", JSON.stringify(opt));

    let { data = {} as T, key } = { ...opt };

    let internalkey: string | undefined;

    try {
      const {
        firebaseApp,
        database: { getDatabase, ref, push: fbpush, child, update },
      } = await getFirebaseCoreEntry();

      if (typeof section !== "string" || !section.trim()) {
        throw th(`push: section is not specified`);
      }

      let processedKey = key;
      if (Array.isArray(processedKey)) {
        processedKey = processedKey.join("/");
      }

      // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
      internalkey = `users/${user}/${section}`;

      if (typeof processedKey === "string") {
        internalkey += "/" + processedKey;
      }
      const db = getDatabase(firebaseApp);

      const dbRef = ref(db, internalkey);

      const newPostKey = fbpush(child(dbRef, internalkey)).key;

      await update(dbRef, {
        [newPostKey]: data,
      });

      const newid = `${internalkey}/${newPostKey}`;

      log.dump({
        push: {
          key,
          newid,
          internalkey,
          data,
          // 'firebase.auth()': firebase.auth()
        },
      });

      autoTryToReAuthenticate = true;

      return newid;
    } catch (e: any) {
      log.dump({
        "push() error:": {
          error: se(e),
          key,
          internalkey,
          data,
          fix,
        },
      });

      setUser(undefined);

      if (autoTryToReAuthenticate) {
        autoTryToReAuthenticate = false;

        console.log("bf");

        await new Promise((res) => setTimeout(res, 1000, undefined));

        console.log("af");

        await reCreateSession();

        return await push(opt);
      }

      throw e;
    }
  }

  async function get<T = any>(key?: string | string[]): Promise<T> {
    let internalkey: string | undefined;

    try {
      const {
        firebaseApp,
        database: { getDatabase, ref, onValue },
      } = await getFirebaseCoreEntry();

      if (typeof section !== "string" || !section.trim()) {
        throw th(`get: section is not specified`);
      }

      let processedKey = key;
      if (Array.isArray(processedKey)) {
        processedKey = processedKey.join("/");
      }

      // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
      internalkey = `users/${user}/${section}`;

      if (typeof processedKey === "string") {
        internalkey += "/" + processedKey;
      }
      // https://firebase.google.com/docs/database/web/read-and-write#read_data_once_with_an_observer
      const db = getDatabase(firebaseApp);

      const dbRef = ref(db, internalkey);

      const snapshot: any = await new Promise((res) => {
        // https://firebase.google.com/docs/database/web/read-and-write#web-version-9_4

        try {
          onValue(
            dbRef,
            (snapshot: any) => {
              res(snapshot);
            },
            {
              onlyOnce: true,
            }
          );
        } catch (e: any) {
          log.dump({
            "get() onValue error:": {
              error: se(e),
              key,
              internalkey,
              fix,
            },
          });
        }
      });

      const data = await snapshot.val();

      log.dump({
        useFirebase_get: data,
        internalkey,
      });

      autoTryToReAuthenticate = true;

      return data;
    } catch (e: any) {
      log.dump({
        "get() error:": {
          error: se(e),
          key,
          internalkey,
          fix,
        },
      });

      setUser(undefined);

      if (autoTryToReAuthenticate) {
        autoTryToReAuthenticate = false;

        await reCreateSession();

        return await get(key);
      }

      throw e;
    }
  }

  async function del(key?: string | string[]): Promise<void> {
    let internalkey: string | undefined;

    try {
      const {
        firebaseApp,
        database: { getDatabase, ref, remove },
      } = await getFirebaseCoreEntry();

      if (typeof section !== "string" || !section.trim()) {
        throw th(`del: section is not specified`);
      }

      let processedKey = key;
      if (Array.isArray(processedKey)) {
        processedKey = processedKey.join("/");
      }

      // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
      internalkey = `users/${user}/${section}`;

      if (typeof processedKey === "string") {
        internalkey += "/" + processedKey;
      }
      const db = getDatabase(firebaseApp);

      const dbRef = ref(db, internalkey);

      await remove(dbRef);

      log.dump({
        firebase_del: internalkey,
      });

      autoTryToReAuthenticate = true;
    } catch (e: any) {
      log.dump({
        "del() error: ": {
          error: se(e),
          key,
          internalkey,
          fix,
        },
      });

      setUser(undefined);

      if (autoTryToReAuthenticate) {
        autoTryToReAuthenticate = false;

        await reCreateSession();

        return await del(key);
      }

      throw e;
    }
  }

  const expirationData = () => {
    // https://firebase.google.com/docs/auth/admin/manage-cookies
    // api v9 https://firebase.google.com/docs/reference/js/auth.md#getidtoken
    // https://firebase.google.com/docs/reference/js/v8/firebase.User#getidtoken
    // https://firebase.google.com/docs/reference/js/auth.user.md#usergetidtoken
    const token = localStorage.getItem("idToken");

    const payload = decodeJwtPayload(token);

    if (payload) {
      return payload;
    }

    console.log("expirationData", "no data");
  };

  window.expirationData = expirationData;

  return {
    firebase,
    error,
    user,
    set,
    get,
    del,
    push,
    getroot,
    expirationData,
    reCreateSession,
    signOut: async function (): Promise<void> {
      log("destroy session");

      const {
        auth: { getAuth, signOut },
      } = await getFirebaseCoreEntry();

      const auth = getAuth();

      await signOut(auth);

      log("destroy idToken in localstorage");

      localStorage.removeItem("idToken");
      localStorage.removeItem("accessToken");
    },
  };
}
