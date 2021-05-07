import React, { useRef, useState, useEffect } from 'react';

// https://stackoverflow.com/a/5346855
var observe;
if (window.attachEvent) {
  observe = function (element, event, handler) {
    element.attachEvent('on'+event, handler);
  };
}
else {
  observe = function (element, event, handler) {
    element.addEventListener(event, handler, false);
  };
}
function init (text, correct) {
  function resize () {
    console && console.log && console.log('fun resize', text)
    //text.style.height = 'auto';
    var h = text.scrollHeight;
    if (Number.isInteger(correct)) {
      h += correct;
    }
    text.style.height = h+'px';
  }
  /* 0-timeout to get the already changed text */
  function delayedResize () {
    window.setTimeout(resize, 0);
  }
  observe(text, 'change',  resize);
  observe(text, 'cut',     delayedResize);
  observe(text, 'paste',   delayedResize);
  observe(text, 'drop',    delayedResize);
  observe(text, 'keydown', delayedResize);

  // text.focus();
  // text.select();
  resize();

  return function () {resize()}
}

export default props => {

  const el = useRef(null);

  const [ resize, setResize ] = useState({});

  const [ mounted, setMounted ] = useState(false);

  const {
    value,
  } = props;

  const {
    correct,
    ...rest
  } = props

  useEffect(() => {

    let _resize = resize._resize;

    if ( ! mounted && el.current ) {

      setMounted(true);

      _resize = init(el.current, correct);

      setResize({
        _resize: _resize
      });
    }

    try {

      _resize();
    }
    catch (e) {

      console && console.log && console.log(`Textarea.js _resize() trigger error: ${e}`);
    }
  }, [value]);

  return (
    <textarea ref={el} {...rest} />
  )
}