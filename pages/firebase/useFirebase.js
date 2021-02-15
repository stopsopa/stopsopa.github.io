
import React, { useEffect, useState } from 'react';

import log from 'inspc'

import se from 'nlab/se'

export default () => {

  const [ firebase, setFirebase ] = useState(false);

  const [ authError, setAuthError ] = useState(false);

  const [ user, setUser ] = useState('');

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

            setAuthError(false);

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

            setAuthError({
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

        setAuthError({
          error: {
            mode: 'signInWithPopup',
            e: se(e),
          }
        });
      }

    }());

  }, []);

  return [
    firebase,
    authError,
    user,
  ];
}