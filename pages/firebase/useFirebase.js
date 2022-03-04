import React, { useEffect, useState } from "react";

import log from "inspc";

import se from "nlab/se";

const th = (msg) => new Error(`useFirebase hook error: ${msg}`);

const fix = `
useEffect(() => {

  if (id) {

    // initialise everything here
    refreshList();
  }

}, [id]);
            
          `;

/**
 * to see how to use this hook look for firebase.entry.jsx
 */
export default ({ section }) => {
  const [firebase, setFirebase] = useState(false);

  const [error, setError] = useState(false);

  const [user, setUser] = useState(false);

  useEffect(() => {
    (async function () {
      try {
        const {
          auth: { getAuth, signInWithPopup, GoogleAuthProvider, signInWithCredential, signOut },
        } = await fire();

        const auth = getAuth();

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

        async function set() {
          try {
            setFirebase(firebase);

            setError(false);

            setUser(auth.currentUser.email.replace(/\./g, ","));
          } catch (e) {
            e.customMessage = ">>>>>>>>>>Origin: set() method<<<<<<<<<<<<";

            throw e;
          }
        }

        let idToken = localStorage.getItem("idToken");

        let accessToken = localStorage.getItem("accessToken");

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
    })();
  }, []);

  const getroot = async (key) => {
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
  };

  const set = async ({ data = {}, key }) => {
    const {
      firebaseApp,
      database: { getDatabase, ref, set },
    } = await fire();

    if (typeof section !== "string" || !section.trim()) {
      throw th(`set: section is not specified`);
    }

    if (Array.isArray(key)) {
      key = key.join("/");
    }

    // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
    let internalkey = `users/${user}/${section}`;

    if (typeof key === "string") {
      internalkey += "/" + key;
    }

    try {
      const db = getDatabase(firebaseApp);

      const dbRef = ref(db, internalkey);

      /**
       * https://firebase.google.com/docs/database/web/read-and-write#web-version-9_5
       */
      await set(dbRef, data);

      log.dump({
        set: {
          key,
          internalkey,
          data,
          // 'firebase.auth()': firebase.auth()
        },
      });
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

      throw e;
    }
  };

  const push = async ({ data = {}, key }) => {
    const {
      firebaseApp,
      database: { getDatabase, ref, push, child, update },
    } = await fire();

    if (typeof section !== "string" || !section.trim()) {
      throw th(`push: section is not specified`);
    }

    if (Array.isArray(key)) {
      key = key.join("/");
    }

    // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
    let internalkey = `users/${user}/${section}`;

    if (typeof key === "string") {
      internalkey += "/" + key;
    }

    try {
      const db = getDatabase(firebaseApp);

      const dbRef = ref(db, internalkey);

      const newPostKey = push(child(dbRef, internalkey)).key;

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

      throw e;
    }
  };

  const get = async (key) => {
    const {
      firebaseApp,
      database: { getDatabase, ref, onValue },
    } = await fire();

    if (typeof section !== "string" || !section.trim()) {
      throw th(`get: section is not specified`);
    }

    if (Array.isArray(key)) {
      key = key.join("/");
    }

    // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
    let internalkey = `users/${user}/${section}`;

    if (typeof key === "string") {
      internalkey += "/" + key;
    }

    try {
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

      const data = snapshot.val();

      log.dump({
        useFirebase_get: data,
        internalkey,
      });

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

      throw e;
    }
  };

  const del = async (key) => {
    const {
      firebaseApp,
      database: { getDatabase, ref, remove },
    } = await fire();

    if (typeof section !== "string" || !section.trim()) {
      throw th(`del: section is not specified`);
    }

    if (Array.isArray(key)) {
      key = key.join("/");
    }

    // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
    let internalkey = `users/${user}/${section}`;

    if (typeof key === "string") {
      internalkey += "/" + key;
    }

    try {
      const db = getDatabase(firebaseApp);

      const dbRef = ref(db, internalkey);

      await remove(dbRef, key);

      log.dump({
        firebase_del: internalkey,
      });
    } catch (e) {
      log.dump({
        "del() error:": {
          error: se(e),
          key,
          internalkey,
          fix,
        },
      });

      throw e;
    }
  };

  return {
    firebase,
    error,
    user,
    set,
    get,
    del,
    push,
    getroot,
  };
};
