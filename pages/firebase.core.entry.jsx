
// Firebase App (the core Firebase SDK) is always required and must be listed first
import firebase from "firebase/app";

// If you enabled Analytics in your project, add the Firebase SDK for Analytics
import "firebase/analytics";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";
import "firebase/database";

import "regenerator-runtime/runtime.js";

import log from 'inspc';

let promise;

window.fire = () => {

  if ( ! promise ) {

    promise = new Promise(resolve => {

      let inter = setInterval(() => {

        if ( typeof window.env === 'function' ) {

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

            apiKey            : env('FIREBASE_API_KEY'),
            authDomain        : env('FIREBASE_AUTH_DOMAIN'),
            databaseURL       : env('FIREBASE_DATABASE_URL'),
            projectId         : env('FIREBASE_PROJECT_ID'),
            storageBucket     : env('FIREBASE_STORAGE_BUCKET'),
            messagingSenderId : env('FIREBASE_MESSAGING_SENDER_ID'),
            appId             : env('FIREBASE_API_ID'),
            measurementId     : env('FIREBASE_MEASUREMENT_ID')
          };

          firebase.initializeApp(firebaseConfig);

          resolve(firebase);
        }

        log('firebase promise lib: waiting for env to load');

      }, 300);
    });
  }

  return promise;
};