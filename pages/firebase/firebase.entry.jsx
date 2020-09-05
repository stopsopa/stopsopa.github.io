
import React, { useEffect, useState } from 'react';

import { render } from 'react-dom';

import log from 'inspc';

const now = () => (new Date()).toISOString().substring(0, 19).replace('T', ' ');

const {serializeError, deserializeError} = require('serialize-error');

const Main = () => {

  const [ firebase, setFirebase ] = useState(false);

  const [ authError, setAuthError ] = useState(false);

  useEffect(() => {

    (async function () {

      try {

        const firebase = await fire();

        let idToken = localStorage.getItem('idToken');

        let accessToken = localStorage.getItem('accessToken');

        log.dump({
          first: firebase.auth().currentUser
        })

        if (idToken && accessToken) {

          try {

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

            log('catch: signInWithCredential')

            setAuthError({
              error: {
                mode: 'signInWithCredential',
                e: serializeError(e),
                user: firebase.auth().currentUser
              }
            });
          }
        }

        log.dump({
          'firebase.auth().currentUser': firebase.auth().currentUser,
        })

        if ( firebase.auth().currentUser ) {

          setFirebase(firebase);

          setAuthError(false);
        }
        else {

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

          setFirebase(firebase);

          setAuthError(false);

          localStorage.setItem('idToken', idToken);

          localStorage.setItem('accessToken', accessToken);
        }
      }
      catch (e) {
        // // Handle Errors here.
        // var errorCode = error.code;
        // var errorMessage = error.message;
        // // The email of the user's account used.
        // var email = error.email;
        // // The firebase.auth.AuthCredential type that was used.
        // var credential = error.credential;

        log('catch: signInWithPopup')

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

  function writeUserData(userId, name, email, imageUrl) {
    firebase.database().ref(`users/${firebase.auth().currentUser.uid}/${now()}`).set({
      userId,
      name,
      email,
      imageUrl,
      uid: firebase.auth().currentUser.uid,
    });
  }

  return (
    <div>
<button onClick={() => writeUserData('xxx', 'name', 'email@gmail.com', 'img.png')}>add</button>
    </div>
  )
}

render(
  <Main />,
  document.getElementById('app')
);

