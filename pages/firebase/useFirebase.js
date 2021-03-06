
import React, { useEffect, useState } from 'react';

import log from 'inspc'

import se from 'nlab/se'

const th = msg => new Error(`useFirebase hook error: ${msg}`);

/**
 * to see how to use this hook look for firebase.entry.jsx
 */
export default ({
  section
}) => {

  const [ firebase, setFirebase ] = useState(false);

  const [ error, setError ] = useState(false);

  const [ user, setUser ] = useState(false);

  useEffect(() => {

    (async function () {

      try {

        const firebase = await fire();

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

            setUser(firebase.auth().currentUser.email.replace(/\./g, ','))

          }
          catch (e) {

            e.customMessage = ">>>>>>>>>>Origin: set() method<<<<<<<<<<<"

            throw e;
          }
        }

        let idToken = localStorage.getItem('idToken');

        let accessToken = localStorage.getItem('accessToken');

        log.dump({
          firebase_first: firebase.auth().currentUser
        })

        if ( ! firebase.auth().currentUser && idToken && accessToken ) {

          try {

            log('firebase_try: signInWithCredential')

            const credential = await firebase.auth.GoogleAuthProvider.credential(idToken, accessToken);

            log.dump({
              firebase_credential: credential
            })

            const user = await firebase.auth().signInWithCredential(credential);

            log.dump({
              firebase_mode: 'signInWithCredential',
              user
            })

          }
          catch (e) {

            log('firebase_catch: signInWithCredential', se(e))

            setError({
              error: {
                mode: 'signInWithCredential -> signOut()',
                e: se(e),
                user: firebase.auth().currentUser,
                truthy: !!firebase.auth().currentUser
              }
            });

            await firebase.auth().signOut();
          }
        }

        log.dump({
          'firebase.auth().currentUser, before second method': firebase.auth().currentUser,
        })

        if ( firebase.auth().currentUser ) {

          log('firebase_signInWithCredential success, trigger set()')

          await set();
        }
        else {

          log('try: signInWithPopup')

          var provider = new firebase.auth.GoogleAuthProvider();

          const result = await firebase.auth().signInWithPopup(provider);

          idToken = result.credential.idToken;

          accessToken = result.credential.accessToken;

          var user = result.user;

          log.dump({
            mode: 'signInWithPopup',
            idToken,
            accessToken,
            user,
            result,
          });

          localStorage.setItem('idToken', idToken);

          localStorage.setItem('accessToken', accessToken);

          await set();
        }
      }
      catch (e) {

        log('catch: signInWithPopup', se(e))

        setError({
          error: {
            mode: 'signInWithPopup',
            e: se(e),
          }
        });
      }

    }());

  }, []);

  function getroot (key) {

    if (typeof section !== 'string' || !section.trim()) {

      throw th(`getroot: section is not specified`);
    }

    if (Array.isArray(key)) {

      key = key.join('/')
    }

    // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
    let internalkey = `users/${user}/${section}`;

    if ( typeof key === 'string' ) {

      internalkey += '/' + key;
    }

    log.dump({
      firebase_getroot: internalkey,
    })

    return internalkey;
  }

  async function set({
    data = {},
    key
  }) {

    if (typeof section !== 'string' || !section.trim()) {

      throw th(`set: section is not specified`);
    }

    if (Array.isArray(key)) {

      key = key.join('/')
    }

    // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
    let internalkey = `users/${user}/${section}`;

    if ( typeof key === 'string' ) {

      internalkey += '/' + key;
    }

    try {

      /**
       * Explore api:
       * g(firebase. database. Reference)
       * https://firebase.google.com/docs/reference/js/firebase.database.Reference
       */

      await firebase.database()
        .ref(internalkey)
        .set(data)
      ;

      log.dump({
        'set': {
          key,
          internalkey,
          data,
          // 'firebase.auth()': firebase.auth()
        },
      })
    }
    catch (e) {

      log.dump({
        'set() error:': {
          error: se(e),
          key,
          internalkey,
          data,
        },
      })

      throw e;
    }
  }

  window.firebaseGet = get;

  async function push({
    data = {},
    key
  }) {

    if (typeof section !== 'string' || !section.trim()) {

      throw th(`push: section is not specified`);
    }

    if (Array.isArray(key)) {

      key = key.join('/')
    }

    // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
    let internalkey = `users/${user}/${section}`;

    if ( typeof key === 'string' ) {

      internalkey += '/' + key;
    }

    try {

      var ref = firebase.database().ref(internalkey);

      var newPostRef = ref.push();

      await newPostRef.set(data);

      const newid = `${internalkey}/${newPostRef.key}`;

      log.dump({
        'push': {
          key,
          newid,
          internalkey,
          data,
          // 'firebase.auth()': firebase.auth()
        },
      })

      return newid;
    }
    catch (e) {

      log.dump({
        'push() error:': {
          error: se(e),
          key,
          internalkey,
          data,
        },
      })

      throw e;
    }
  }

  async function get(key) {

    if (typeof section !== 'string' || !section.trim()) {

      throw th(`get: section is not specified`);
    }

    if (Array.isArray(key)) {

      key = key.join('/')
    }

    // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
    let internalkey = `users/${user}/${section}`;

    if ( typeof key === 'string' ) {

      internalkey += '/' + key;
    }

    try {

      // https://firebase.google.com/docs/database/web/read-and-write#read_data_once_with_an_observer
      const data = await firebase.database()
        .ref(internalkey)
        .once('value')
      ;

      const snapshot = await data.val();

      log.dump({
        useFirebase_get: snapshot,
        internalkey,
      })

      return snapshot;
    }
    catch (e) {

      log.dump({
        'get() error:': {
          error: se(e),
          key,
          internalkey,
        },
      })

      throw e;
    }
  }

  async function del(key) {

    if (typeof section !== 'string' || !section.trim()) {

      throw th(`del: section is not specified`);
    }

    if (Array.isArray(key)) {

      key = key.join('/')
    }

    // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
    let internalkey = `users/${user}/${section}`;

    if ( typeof key === 'string' ) {

      internalkey += '/' + key;
    }

    try {

      log.dump({
        firebase_del: internalkey,
      })

      return await firebase.database()
        .ref(internalkey)
        .remove(); // https://firebase.google.com/docs/database/web/read-and-write#delete_data
      ;
    }
    catch (e) {

      log.dump({
        'del() error:': {
          error: se(e),
          key,
          internalkey,
        },
      })

      throw e;
    }
  }

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
}