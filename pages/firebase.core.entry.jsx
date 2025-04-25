// Firebase App (the core Firebase SDK) is always required and must be listed first
import { initializeApp } from "firebase/app";

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  getIdToken,
  onAuthStateChanged,
} from "firebase/auth";

import { getDatabase, ref, child, onValue, push, update, remove, set } from "firebase/database";

import {
  all,
  get,
  has,
  getDefault,
  getThrow,
  getIntegerThrowInvalid, // equivalent to get
  getIntegerDefault,
  getIntegerThrow,
} from "envprocessor";

// import "regenerator-runtime/runtime.js";

let promise;

window.firebaseCoreEntry = () => {
  function rePromise() {
    return (promise = new Promise((resolve) => {
      let inter = setInterval(() => {
        if (typeof window.env === "function") {
          clearInterval(inter);

          const env = window.env;

          var firebaseConfig = {
            // apiKey: "AIzaSyBwjXbJQTXj258mLFMcHswgy6FgKHVHMLs",
            // authDomain: "github-ae2af.firebaseapp.com",
            // databaseURL: "https://github-ae2af.firebaseio.com",
            // projectId: "github-ae2af",
            // storageBucket: "github-ae2af.appspot.com",
            // messagingSenderId: "496172961972",
            //
            // appId: "1:496172961972:web:c9363e230fede3127a07e1",
            // measurementId: "G-F78BC9VYQ5"

            // apiKey: process.env.FIREBASE_API_KEY,
            // authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            // databaseURL: process.env.FIREBASE_DATABASE_URL,
            // projectId: process.env.FIREBASE_PROJECT_ID,
            // storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            // messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            //
            // appId: "1:496172961972:web:c9363e230fede3127a07e1",
            // measurementId: "G-F78BC9VYQ5"

            apiKey: getThrow("FIREBASE_API_KEY"),
            authDomain: getThrow("FIREBASE_AUTH_DOMAIN"),
            databaseURL: getThrow("FIREBASE_DATABASE_URL"),
            projectId: getThrow("FIREBASE_PROJECT_ID"),
            storageBucket: getThrow("FIREBASE_STORAGE_BUCKET"),
            messagingSenderId: getThrow("FIREBASE_MESSAGING_SENDER_ID"),
            appId: getThrow("FIREBASE_API_ID"),

            // Your web app's Firebase configuration
            // For Firebase JS SDK v7.20.0 and later, measurementId is optional
            // measurementId     : getThrow('FIREBASE_MEASUREMENT_ID')
          };

          const firebaseApp = initializeApp(firebaseConfig);

          resolve({
            firebaseApp,
            rePromise,
            auth: {
              getAuth,
              signInWithPopup,
              GoogleAuthProvider,
              signInWithCredential,
              signOut,
              getIdToken,
              onAuthStateChanged,
            },
            database: {
              getDatabase,
              ref,
              child,
              onValue,
              push,
              update,
              remove,
              set,
            },
          });
        }
      }, 300);
    }));
  }

  if (!promise) {
    rePromise();
  }

  return promise;
};
