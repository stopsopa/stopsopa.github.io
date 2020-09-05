
// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// If you enabled Analytics in your project, add the Firebase SDK for Analytics
import "firebase/analytics";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";
import "firebase/database";

import "regenerator-runtime/runtime.js";

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

            // apiKey: process.env.API_KEY,
            // authDomain: process.env.AUTH_DOMAIN,
            // databaseURL: process.env.DATABASE_URL,
            // projectId: process.env.PROJECT_ID,
            // storageBucket: process.env.STORAGE_BUCKET,
            // messagingSenderId: process.env.MESSAGING_SENDER_ID,
            //
            // appId: "1:496172961972:web:c9363e230fede3127a07e1",
            // measurementId: "G-F78BC9VYQ5"

            apiKey            : env('API_KEY'),
            authDomain        : env('AUTH_DOMAIN'),
            databaseURL       : env('DATABASE_URL'),
            projectId         : env('PROJECT_ID'),
            storageBucket     : env('STORAGE_BUCKET'),
            messagingSenderId : env('MESSAGING_SENDER_ID'),
            appId             : env('API_ID'),
            measurementId     : env('MEASUREMENT_ID')
          };

          firebase.initializeApp(firebaseConfig);

          resolve(firebase);
        }
      }, 300);
    });
  }

  return promise;
};