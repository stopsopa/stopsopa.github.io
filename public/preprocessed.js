window.log = (function () {
      try {
        return console.log;
      } catch (e) {
        return function () {};
      }
    })();
    
    window.env = (function (e) {

      if ( ! window.process ) {
          
          window.process = {}
      }
      
      window.process.env = e;
      
      return function (key, def) {
        if (typeof key === "undefined") {
          return Object.assign({}, e);
        }
    
        if (typeof key !== "string") {
          throw new Error(
            "preprocessed.js window.env() error: key is not a string"
          );
        }
    
        if (!key.trim()) {
          throw new Error(
            "preprocessed.js window.env() error: key is an empty string"
          );
        }
    
        var val = e[key];
    
        if (typeof val === "undefined") {
          return def;
        }
    
        return val;
      };
    })({
      PROJECT_NAME: "stopsopatools",
  GITHUB_SOURCES_PREFIX: "https://github.com/stopsopa/stopsopa.github.io",
  NODE_API_PORT: "7898",
  FIREBASE_API_KEY: "AIzaSyB6lAe7IMCxkjIJMHEXpS26emx-yLQOol8",
  FIREBASE_AUTH_DOMAIN: "github-f6a5f.firebaseapp.com",
  FIREBASE_DATABASE_URL: "https://github-f6a5f.firebaseio.com",
  FIREBASE_PROJECT_ID: "github-f6a5f",
  FIREBASE_STORAGE_BUCKET: "github-f6a5f.appspot.com",
  FIREBASE_MESSAGING_SENDER_ID: "389489861217",
  FIREBASE_API_ID: "1:389489861217:web:c7effb017403f3c45ac020",
  GIPHY_API_KEY: "S8GTa08FAtKLN83OrjN1d6bGDKxGecHN",
    });
    
    log("const env = window.env");
    