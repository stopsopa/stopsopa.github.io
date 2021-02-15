
import React, { useEffect, useState } from 'react';

import { render } from 'react-dom';

import log from 'inspc';

const now = () => (new Date()).toISOString().substring(0, 19).replace('T', ' ').replace(/[^\d]/g, '-');

import se from 'nlab/se';

import useFirebase from './useFirebase'

const Main = () => {

  const [
    firebase,
    authError,
    user
  ] = useFirebase();

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
          error: se(e),
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
      <button onClick={
        () => writeUserData(
          'xxx',
          'name',
          'email@gmail.com',
          'img.png'
        )
      }>add</button>
      <br />
      <input type="text" value={user} onChange={e => setUser(e.target.value)} style={{width: '80%'}}/>
      {
        (/[\.#$\[\]]/.test(user)) &&
        <div style={{color: 'red'}}>Paths must be non-empty strings and can't contain ".", "#", "$", "[", or "]"</div>
      }
    </div>
  )
}

render(
  <Main />,
  document.getElementById('app')
);

