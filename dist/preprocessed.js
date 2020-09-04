      
  
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
    "API_KEY": "AIzaSyBwjXbJQTXj258mLFMcHswgy6FgKHVHMLs",
    "AUTH_DOMAIN": "github-ae2af.firebaseapp.com",
    "DATABASE_URL": "https://github-ae2af.firebaseio.com",
    "PROJECT_ID": "github-ae2af",
    "STORAGE_BUCKET": "github-ae2af.appspot.com",
    "MESSAGING_SENDER_ID": "496172961972",
    "API_ID": "1:496172961972:web:c9363e230fede3127a07e1",
    "MEASUREMENT_ID": "G-F78BC9VYQ5"
}))

log("const env = window.env;")
  
  