import { useEffect, useState } from "react";

import log from "inspc";

import se from "nlab/serializeError";

const th = (msg) => new Error(`useFirebase hook error: ${msg}`);

const fix = `
useEffect(() => {

  if (id) {

    // initialise everything here
    refreshList();
  }

}, [id]);            
`;

function decodeJwtPayload(token) {
  if (typeof token === "string" && token.trim()) {
    const segments = token.split(".");

    // console.log("expirationData segments", segments);

    if (segments.length === 3) {
      let json;

      try {
        json = JSON.parse(atob(segments[1]));
      } catch (e) {
        console.log("expirationData expirationData decoding json error: ", e);
      }

      if (json) {
        json._exp = new Date(json.exp * 1000);

        json._minutes_left = parseInt((json.exp - new Date().getTime() / 1000) / 60, 10);

        return json;
      }
    }
  }
}

function logCurrentToken(comment = "", token) {
  if (!token) {
    token = localStorage.getItem("idToken");
  }

  console.log("localStorage jwt 'idToken' payload", comment, JSON.stringify(decodeJwtPayload(token), null, 4));
}

let autoTryToReAuthenticate = true;

/**
 * to see how to use this hook look for firebase.entry.jsx
 *
 * Read more about API: https://firebase.google.com/docs/reference/js
 */
export default ({ section }) => {
  const [firebase, setFirebase] = useState(false);

  const [error, setError] = useState(false);

  const [user, setUser] = useState();

  async function reCreateSession() {
    try {
      const {
        auth: { getAuth, signInWithPopup, GoogleAuthProvider, signInWithCredential, signOut, getIdToken },
      } = await firebaseCoreEntry();

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
        } catch (e) {
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
        } catch (e) {
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

        localStorage.setItem("idToken", idToken);

        localStorage.setItem("accessToken", accessToken);
      }

      await set();
    } catch (e) {
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

  async function getroot(key) {
    if (typeof section !== "string" || !section.trim()) {
      throw th(`getroot: section is not specified`);
    }

    if (Array.isArray(key)) {
      key = key.join("/");
    }

    // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
    let internalkey = `users/${user}/${section}`;

    if (typeof key === "string") {
      internalkey += "/" + key;
    }

    log.dump({
      firebase_getroot: internalkey,
    });

    return internalkey;
  }

  async function set(opt) {
    let { data = {}, key } = { ...opt };

    let internalkey;

    try {
      const {
        firebaseApp,
        database: { getDatabase, ref, set: fbset },
      } = await firebaseCoreEntry();

      if (typeof section !== "string" || !section.trim()) {
        throw th(`set: section is not specified`);
      }

      if (Array.isArray(key)) {
        key = key.join("/");
      }

      // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
      internalkey = `users/${user}/${section}`;

      if (typeof key === "string") {
        internalkey += "/" + key;
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
    } catch (e) {
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

  async function push(opt) {
    console.log("push...", JSON.stringify(opt));

    let { data = {}, key } = { ...opt };

    let internalkey;

    try {
      const {
        firebaseApp,
        database: { getDatabase, ref, push: fbpush, child, update },
      } = await firebaseCoreEntry();

      if (typeof section !== "string" || !section.trim()) {
        throw th(`push: section is not specified`);
      }

      if (Array.isArray(key)) {
        key = key.join("/");
      }

      // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
      internalkey = `users/${user}/${section}`;

      if (typeof key === "string") {
        internalkey += "/" + key;
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
    } catch (e) {
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

  async function get(key) {
    let internalkey;

    try {
      const {
        firebaseApp,
        database: { getDatabase, ref, onValue },
      } = await firebaseCoreEntry();

      if (typeof section !== "string" || !section.trim()) {
        throw th(`get: section is not specified`);
      }

      if (Array.isArray(key)) {
        key = key.join("/");
      }

      // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
      internalkey = `users/${user}/${section}`;

      if (typeof key === "string") {
        internalkey += "/" + key;
      }
      // https://firebase.google.com/docs/database/web/read-and-write#read_data_once_with_an_observer
      const db = getDatabase(firebaseApp);

      const dbRef = ref(db, internalkey);

      const snapshot = await new Promise((res) => {
        // https://firebase.google.com/docs/database/web/read-and-write#web-version-9_4

        try {
          onValue(
            dbRef,
            (snapshot) => {
              res(snapshot);
            },
            {
              onlyOnce: true,
            }
          );
        } catch (e) {
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
    } catch (e) {
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

  async function del(key) {
    let internalkey;

    try {
      const {
        firebaseApp,
        database: { getDatabase, ref, remove },
      } = await firebaseCoreEntry();

      if (typeof section !== "string" || !section.trim()) {
        throw th(`del: section is not specified`);
      }

      if (Array.isArray(key)) {
        key = key.join("/");
      }

      // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
      internalkey = `users/${user}/${section}`;

      if (typeof key === "string") {
        internalkey += "/" + key;
      }
      const db = getDatabase(firebaseApp);

      const dbRef = ref(db, internalkey);

      await remove(dbRef, key);

      log.dump({
        firebase_del: internalkey,
      });

      autoTryToReAuthenticate = true;
    } catch (e) {
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
    signOut: async function () {
      log("destroy session");

      const {
        auth: { getAuth, signInWithPopup, GoogleAuthProvider, signInWithCredential, signOut, getIdToken },
      } = await firebaseCoreEntry();

      const auth = getAuth();

      await signOut(auth);

      log("destroy idToken in localstorage");

      localStorage.removeItem("idToken");
      localStorage.removeItem("accessToken");
    },
  };
};
