      
  
window.log = (function () {
    try {
        return console.log;
    }
    catch (e) {
        return function () {};
    }
}());

window.env = (function (e) {
    return function (key, def) {
    
        if (typeof key === 'undefined') {
        
            return Object.assign({}, e);
        }
        
        if (typeof key !== 'string') {
        
            throw new Error("preprocessor.js error: key is not a string");
        }
        
        if ( ! key.trim() ) {
        
            throw new Error("preprocessor.js error: key is an empty string");
        }
        
        var val = e[key];
        
        if ( typeof val === 'undefined') {
            
            return def;
        }
        
        return val;
    }
}({
    "PROJECT_NAME": "stopsopatools",
    "NODE_PORT": "7898",
    "FIREBASE_API_KEY": "AIzaSyBwjXbJQTXj258mLFMcHswgy6FgKHVHMLs",
    "FIREBASE_AUTH_DOMAIN": "github-ae2af.firebaseapp.com",
    "FIREBASE_DATABASE_URL": "https://github-ae2af.firebaseio.com",
    "FIREBASE_PROJECT_ID": "github-ae2af",
    "FIREBASE_STORAGE_BUCKET": "github-ae2af.appspot.com",
    "FIREBASE_MESSAGING_SENDER_ID": "496172961972",
    "FIREBASE_API_ID": "1:496172961972:web:c9363e230fede3127a07e1",
    "FIREBASE_MEASUREMENT_ID": "G-F78BC9VYQ5"
}))

log("const env = window.env;")
  
  