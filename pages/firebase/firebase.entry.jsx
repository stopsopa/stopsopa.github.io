
import React, { useEffect, useState } from 'react';

import { render } from 'react-dom';

import log from 'inspc';

const now = () => (new Date()).toISOString().substring(0, 19).replace('T', ' ').replace(/[^\d]/g, '-');

import se from 'nlab/se';

import useFirebase from './useFirebase'

const Main = () => {

  const {
    firebase,
    error,
    user,
    set,
    get,
  } = useFirebase({
    section: `!!!useFirebase_test_can_be_safely_removed`
  });

  if ( error ) {

    return <pre>{JSON.stringify({
      error,
    }, null, 4)}</pre>
  }

  if ( ! user ) {

    return <div>Connecting to firebase...</div>
  }

  return (
    <div>
      <button onClick={
        () => {

          const cu = firebase.auth().currentUser;

          const data = {
            uid           : cu.uid,
            displayName   : cu.displayName,
            email         : cu.email,
            emailVerified : cu.emailVerified,
            isAnonymous   : cu.isAnonymous,
            metadata      : cu.metadata,
            photoURL      : cu.photoURL,
            extra: 'data'
          };

          return set({
            key: 'xxx',
            data,
          });
        }
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

