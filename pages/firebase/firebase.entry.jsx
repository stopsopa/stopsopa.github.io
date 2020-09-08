
import React, { useEffect, useState } from 'react';

import { render } from 'react-dom';

import log from 'inspc';

const now = () => (new Date()).toISOString().substring(0, 19).replace('T', ' ').replace(/[^\d]/g, '-');

const {serializeError, deserializeError} = require('serialize-error');

const Main = () => {

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
          first: firebase.auth().currentUser
        })

        if (!firebase.auth().currentUser && idToken && accessToken) {

          try {

            log('try: signInWithCredential')

            const credential = await firebase.auth.GoogleAuthProvider.credential(idToken, accessToken);

            log.dump({
              credential
            })

            const user = await firebase.auth().signInWithCredential(credential);

            log.dump({
              mode: 'signInWithCredential',
              user
            })

          }
          catch (e) {

            log('catch: signInWithCredential', serializeError(e))

            setAuthError({
              error: {
                mode: 'signInWithCredential -> signOut()',
                e: serializeError(e),
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

          log('signInWithCredential success, trigger set()')

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

        log('catch: signInWithPopup', serializeError(e))

        setAuthError({
          error: {
            mode: 'signInWithPopup',
            e: serializeError(e),
          }
        });
      }

    }());

  }, []);

  if ( authError ) {

    return <pre>{JSON.stringify({
      authError,
    }, null, 4)}</pre>
  }

  if ( ! firebase ) {

    return <div>Connecting to firebase...</div>
  }

  async function writeUserData(userId, name, email, imageUrl) {

    // https://firebase.google.com/docs/reference/security/database#replacesubstring_replacement
    const key = `users/${user}`;

    const cu = firebase.auth().currentUser;

    const data = {
      uid           : cu.uid,
      displayName   : cu.displayName,
      email         : cu.email,
      emailVerified : cu.emailVerified,
      isAnonymous   : cu.isAnonymous,
      metadata      : cu.metadata,
      photoURL      : cu.photoURL,
    };

    try {

      await firebase.database()
        .ref(key)
        .set(data)
      ;

      log.dump({
        'set() saved:': {
          key,
          data,
          'firebase.auth()': firebase.auth()
        },
      })
    }
    catch (e) {

      log.dump({
        'set() error:': {
          error: serializeError(e),
          key,
          data,
          'firebase.auth()': firebase.auth()
        },
      })

      throw e;

    }
  }

  return (
    <div>
      <button onClick={() => writeUserData('xxx', 'name', 'email@gmail.com', 'img.png')}>add</button>
      <br />
      <input type="text" value={user} onChange={e => setUser(e.target.value)} style={{width: '80%'}}/>
      {(/[\.#$\[\]]/.test(user)) && <div style={{color: 'red'}}>Paths must be non-empty strings and can't contain ".", "#", "$", "[", or "]"</div>}
    </div>
  )
}

render(
  <Main />,
  document.getElementById('app')
);

