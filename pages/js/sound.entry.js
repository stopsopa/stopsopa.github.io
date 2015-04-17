import React, { useEffect, useState, useRef } from "react";

import Ace, { languages, bringFocus, pokeEditorsToRerenderBecauseSometimesTheyStuck } from "../macro/Ace.jsx";

import { render } from "react-dom";

import classnames from "classnames";

import notes from "./notes-frequencies.json";

const types = ["sine", "square", "sawtooth", "triangle"];

const noteMatch = /^[A-Z]\d$/;
const noteEnd = /^B\d$/;

const localstorageKey = "sound-experiment";

var BrowserDetect = {
  init: function () {
    this.identifyBrowser();
    if ("Explorer" == this.browser) {
      if (((this.IE = !0), 8 >= this.majorVersion || 8 === document.documentMode)) this.IE8 = !0;
    } else
      "Firefox" == this.browser
        ? (this.Firefox = !0)
        : "Chrome" == this.browser
        ? (this.Chrome = !0)
        : "Safari" == this.browser
        ? (this.Safari = !0)
        : "Edge" == this.browser
        ? (this.Edge = !0)
        : "Opera" == this.browser && (this.Opera = !0);
    this.supportsClipboardWriting = document.queryCommandSupported("copy");
    this.identifyOS();
    "Windows" == this.OS
      ? (this.Windows = !0)
      : "iOS" == this.OS
      ? (this.iOS = !0)
      : "MacOS" == this.OS && (this.MacOS = !0);
  },
  identifyBrowser: function () {
    for (var a = 0; a < this.dataBrowser.length; a++) {
      var c = this.dataBrowser[a];
      if (-1 != (c.string || navigator.userAgent).indexOf(c.subString)) {
        this.browser = c.identity;
        a = c.versionSearch || c.subString;
        (c = this.searchVersion(navigator.userAgent, a))
          ? ((this.version = c), (this.majorVersion = Math.floor(c)))
          : (c = this.searchVersion(navigator.appVersion, a))
          ? ((this.version = c), (this.majorVersion = Math.floor(c)))
          : (this.majorVersion = this.version = "Unknown");
        return;
      }
    }
    this.version = this.browser = "Unknown";
  },
  identifyOS: function () {
    for (var a = 0; a < this.dataOS.length; a++)
      if (-1 != this.dataOS[a].string.indexOf(this.dataOS[a].subString)) {
        this.OS = this.dataOS[a].identity;
        return;
      }
    this.OS = "Unknown";
  },
  searchVersion: function (a, c) {
    var b;
    return -1 != (b = a.indexOf(c)) ? parseFloat(a.substring(b + c.length + 1)) : null;
  },
  dataBrowser: [
    { subString: "Opera", identity: "Opera" },
    { subString: "OPR", identity: "Opera" },
    { subString: "Edge", identity: "Edge" },
    { subString: "MSIE", identity: "Explorer" },
    { subString: "Trident", identity: "Explorer", versionSearch: "rv" },
    { subString: "Firefox", identity: "Firefox" },
    { subString: "Chrome", identity: "Chrome" },
    {
      string: navigator.vendor,
      subString: "Apple",
      identity: "Safari",
      versionSearch: "Version",
    },
    { subString: "Apple", identity: "Safari", versionSearch: "Version" },
  ],
  dataOS: [
    { string: navigator.platform, subString: "Mac", identity: "MacOS" },
    { string: navigator.platform, subString: "iPad", identity: "iOS" },
    { string: navigator.platform, subString: "iPhone", identity: "iOS" },
    { string: navigator.platform, subString: "iPod", identity: "iOS" },
    { string: navigator.userAgent, subString: "Android", identity: "Android" },
    { string: navigator.userAgent, subString: "android", identity: "Android" },
    { string: navigator.platform, subString: "Linux", identity: "Linux" },
    { string: navigator.platform, subString: "Win", identity: "Windows" },
  ],
};
BrowserDetect.init();

const DEFAULT_VOLUME = 0.75;
var FADE_TIME = 0.25;
const FADE_SET_TARGET_TIME_CONSTANT = 0.05,
  MIN_FREQ = 1,
  MAX_FREQ = 20154,
  MIN_PIANO_KEY = 1,
  MAX_PIANO_KEY = 99,
  FIRST_C = 4,
  NOTE_NAMES =
    ";A0 Dbl Pedal A;A\u266f0\u2009/\u2009B\u266d0;B0;C1 Pedal C;C\u266f1\u2009/\u2009D\u266d1;D1;D\u266f1\u2009/\u2009E\u266d1;E1;F1;F\u266f1\u2009/\u2009G\u266d1;G1;G\u266f1\u2009/\u2009A\u266d1;A1;A\u266f1\u2009/\u2009B\u266d1;B1;C2 Deep C;C\u266f2\u2009/\u2009D\u266d2;D2;D\u266f2\u2009/\u2009E\u266d2;E2;F2;F\u266f2\u2009/\u2009G\u266d2;G2;G\u266f2\u2009/\u2009A\u266d2;A2;A\u266f2\u2009/\u2009B\u266d2;B2;C3 Tenor C;C\u266f3\u2009/\u2009D\u266d3;D3;D\u266f3\u2009/\u2009E\u266d3;E3;F3;F\u266f3\u2009/\u2009G\u266d3;G3;G\u266f3\u2009/\u2009A\u266d3;A3;A\u266f3\u2009/\u2009B\u266d3;B3;C4 Middle C;C\u266f4\u2009/\u2009D\u266d4;D4;D\u266f4\u2009/\u2009E\u266d4;E4;F4;F\u266f4\u2009/\u2009G\u266d4;G4;G\u266f4\u2009/\u2009A\u266d4;A4;A\u266f4\u2009/\u2009B\u266d4;B4;C5;C\u266f5\u2009/\u2009D\u266d5;D5;D\u266f5\u2009/\u2009E\u266d5;E5;F5;F\u266f5\u2009/\u2009G\u266d5;G5;G\u266f5\u2009/\u2009A\u266d5;A5;A\u266f5\u2009/\u2009B\u266d5;B5;C6 Soprano C;C\u266f6\u2009/\u2009D\u266d6;D6;D\u266f6\u2009/\u2009E\u266d6;E6;F6;F\u266f6\u2009/\u2009G\u266d6;G6;G\u266f6\u2009/\u2009A\u266d6;A6;A\u266f6\u2009/\u2009B\u266d6;B6;C7 Dbl high C;C\u266f7\u2009/\u2009D\u266d7;D7;D\u266f7\u2009/\u2009E\u266d7;E7;F7;F\u266f7\u2009/\u2009G\u266d7;G7;G\u266f7\u2009/\u2009A\u266d7;A7;A\u266f7\u2009/\u2009B\u266d7;B7;C8;C\u266f8\u2009/\u2009D\u266d8;D8;D\u266f8\u2009/\u2009E\u266d8;E8;F8;F\u266f8\u2009/\u2009G\u266d8;G8;G\u266f8\u2009/\u2009A\u266d8;A8;A\u266f8\u2009/\u2009B\u266d8;B8".split(
      ";"
    );

function Tone(a, c) {
  var b = this;
  b.channels = 1 !== c ? 2 : 1;
  b.playing = !1;
  b.volume = 1;
  b.balance = 0;
  b.freq = 440;
  b.type = "sine";
  b.oscillator = b.gainNode = b.fadeGainNode = b.mergerNode = b.leftGainNode = b.rightGainNode = null;
  b.oscillatorStopTimeoutID = null;
  b.fadeStartTime = 0;
  b.init = function (c, e, g, f) {
    b.gainNode = a.createGain();
    b.fadeGainNode = a.createGain();
    2 == b.channels &&
      ((b.mergerNode = a.createChannelMerger(2)),
      (b.leftGainNode = a.createGain()),
      (b.rightGainNode = a.createGain()),
      b.leftGainNode.connect(b.mergerNode, 0, 0),
      b.rightGainNode.connect(b.mergerNode, 0, 1),
      b.mergerNode.connect(b.gainNode));
    b.gainNode.connect(b.fadeGainNode);
    b.fadeGainNode.connect(a.destination);
    b.freq = c || 440;
    b.type = e || "sine";
    b.volume = g || 1;
    b.balance = f || 0;

    2 == b.channels &&
      ((b.leftGainNode.gain.value = Math.min(1, 1 - b.balance)),
      (b.rightGainNode.gain.value = Math.min(1, 1 + b.balance)));
    b.gainNode.gain.value = b.volume;
    b.fadeGainNode.gain.value = 0;
  };

  b.initOscillator = function () {
    b.oscillator = a.createOscillator();
    2 == b.channels
      ? (b.oscillator.connect(b.leftGainNode), b.oscillator.connect(b.rightGainNode))
      : b.oscillator.connect(b.gainNode);
    b.oscillator.frequency.value = b.freq;
    b.oscillator.type = b.type;
  };
  b.play = function (c) {
    void 0 === c && (c = a.currentTime);
    if (b.oscillatorStopTimeoutID) clearTimeout(b.oscillatorStopTimeoutID), (b.oscillatorStopTimeoutID = null);
    else {
      if (b.playing) return !1;
      b.initOscillator();
      b.oscillator.start(c);
    }
    BrowserDetect.Firefox
      ? b.fadeGainNode.gain.setTargetAtTime(1, c, FADE_SET_TARGET_TIME_CONSTANT)
      : (b.fadeGainNode.gain.cancelScheduledValues(c),
        b.fadeGainNode.gain.setValueAtTime(b.fadeGainNode.gain.value, c),
        b.fadeGainNode.gain.linearRampToValueAtTime(1, c + FADE_TIME * (1 - b.fadeGainNode.gain.value)));
    b.playing = !0;
  };
  b.stop = function (c) {
    if (!b.playing) return !1;
    void 0 === c && (c = a.currentTime);
    if (BrowserDetect.Firefox)
      b.fadeGainNode.gain.setTargetAtTime(0, c, FADE_SET_TARGET_TIME_CONSTANT),
        (c = 1e3 * (c - a.currentTime + 8 * FADE_SET_TARGET_TIME_CONSTANT));
    else {
      b.fadeGainNode.gain.cancelScheduledValues(c);
      b.fadeGainNode.gain.setValueAtTime(b.fadeGainNode.gain.value, c);
      var d = FADE_TIME * b.fadeGainNode.gain.value;
      b.fadeGainNode.gain.linearRampToValueAtTime(0, c + d);
      c = 1e3 * (c - a.currentTime + d + 0.5);
    }
    b.oscillatorStopTimeoutID = setTimeout(function () {
      b.oscillator.stop();
      b.oscillatorStopTimeoutID = null;
      b.playing = !1;
    }, c);
  };
  b.setFreq = function (c) {
    b.freq = c;
    b.playing && b.oscillator.frequency.setTargetAtTime(c, a.currentTime, 0.03);
  };
  b.setType = function (a) {
    b.type = a;
    b.playing && (b.oscillator.type = a);
  };
  b.setBalance = function (c) {
    if (2 !== b.channels) return !1;
    b.balance = c;
    b.playing
      ? (b.leftGainNode.gain.setTargetAtTime(Math.min(1, 1 - c), a.currentTime, FADE_SET_TARGET_TIME_CONSTANT),
        b.rightGainNode.gain.setTargetAtTime(Math.min(1, 1 + c), a.currentTime, FADE_SET_TARGET_TIME_CONSTANT))
      : (b.leftGainNode.gain.setValueAtTime(Math.min(1, 1 - c), a.currentTime),
        b.rightGainNode.gain.setValueAtTime(Math.min(1, 1 + c), a.currentTime));
  };
  b.setVolume = function (c) {
    b.playing
      ? b.gainNode.gain.setTargetAtTime(c, a.currentTime, FADE_SET_TARGET_TIME_CONSTANT)
      : b.gainNode.gain.setValueAtTime(c, a.currentTime);
    b.volume = c;
  };
}

var tones = {
  array: [],
  current: null,
  playing: false,
  init: function () {
    if (window.AudioContext) tones.context = new AudioContext(); // xx
    else if (window.webkitAudioContext) tones.context = new webkitAudioContext();
    else throw "Cannot initialize AudioContext";
  },
  add: function () {
    tones.current = new Tone(tones.context);
    tones.current.init();
    tones.array.push(tones.current);
  },
  remove: function (a) {
    if (!tones.array[a]) return false;
    for (a += 1; a < tones.array[length]; a++) tones.array[a - 1] = tones.array[a];

    --tones.array.length;
  },
  select: function (a) {
    if (!tones.array[a]) return false;
    tones.current = tones.array[a];
  },
  play: function () {
    tones.playing = true;
    tones.context.state === "suspended" && tones.context.resume();
    for (var a = 0; a < tones.array.length; a++) tones.array[a].play();
  },
  stop: function () {
    tones.playing = false;
    for (var a = 0; a < tones.array.length; a++) tones.array[a].stop();
  },
};

tones.init();
tones.add();

window.tones = tones;
// tones.current.setFreq(window.sliderFreq);
// tones.current.setBalance(a); -1 - 0 1
// tones.current.setType(a); // sine | square | triangle | sawtooth
// tones.current.setVolume(window.volume); 0 - 1

function debounce(fn, delay) {
  var timer = null;
  return function () {
    var context = this,
      args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}

const defaults = {
  frequency: 460,
  volume: 0.1,
  balance: 0,
  duration: 1000,
  type: types[0],
};

const trigger = debounce((fn) => {
  fn();
}, 30);

const hearingStart = {
  normal: 1,
  test: 8000,
  min: 1,
  max: 22000,
};

const Main = () => {
  const [hearing, setHearing] = useState(false);

  const [beepMode, setBeepMode] = useState(true);

  const [frequency, setFrequency] = useState(defaults.frequency);

  const [volume, setVolume] = useState(parseInt(defaults.volume * 100, 10));

  const [balance, setBalance] = useState(parseInt(defaults.balance, 10));

  const [duration, setDuration] = useState(defaults.duration);

  const [type, setType] = useState(defaults.type);

  const [playing, setPlaying] = useState(false);

  const volumeCals = parseFloat((volume / 100).toFixed(2));

  let value;

  function beepFunc(freq, dur) {
    return `
{    
  const beep = (function () {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return function (opt) {
      let { volume, frequency, type, duration } = {
        volume: ${defaults.volume},
        frequency: ${defaults.frequency},
        type: "${defaults.type}",
        duration: ${defaults.duration},
        ...opt,
      };
      return new Promise((resolve) => {
      var oscillator = audioCtx.createOscillator();
      var gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      gainNode.gain.value = volume;
      oscillator.frequency.value = frequency;
      oscillator.type = type;

      oscillator.start();

      setTimeout(function () {
        oscillator.stop();
          resolve();
        }, duration);
      });
    };
  })(); 

  beep({
    volume: ${volumeCals},
    frequency: ${typeof freq === "undefined" ? frequency : freq},
    type: "${type}",
    duration: "${typeof dur === "undefined" ? duration : dur}"
  });

  // execute this line from other tabs to trigger sound on this tab
  localStorage.setItem('${localstorageKey}', ${typeof freq === "undefined" ? frequency : freq})
}


     
     `;
  }

  if (beepMode) {
    value = beepFunc();
  } else {
    value = `
{
  const beep = (function () {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return function (opt) {
      let { volume, frequency, type, duration } = {
        volume: ${defaults.volume},
        frequency: ${defaults.frequency},
        type: "${defaults.type}",
        ...opt,
      };
      var oscillator = audioCtx.createOscillator();
      var gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      gainNode.gain.value = volume;
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      oscillator.start();
      
      return () => {
        oscillator.stop();
      }
    };
  })(); 

  const stop = beep({
    volume: ${volumeCals},
    frequency: ${frequency},
    type: "${type}"
  });

  window.beepStackStop || (window.beepStackStop = []); 
  window.beepStackStop.push(stop)
  // then run beepStackStop.pop()() to stop

  // execute this line from other tabs to trigger sound on this tab
  localStorage.setItem('${localstorageKey}', ${typeof freq === "undefined" ? frequency : freq})
}
`;
  }

  useEffect(() => {
    tones.current.setFreq(frequency);
  }, [frequency]);

  useEffect(() => {
    tones.current.setVolume(volume / 100);
  }, [volume]);

  useEffect(() => {
    tones.current.setType(type);
  }, [type]);

  useEffect(() => {
    tones.current.setBalance(balance / 100);
  }, [balance]);

  useEffect(() => {
    if (hearing) {
      setFrequency(hearingStart.max);
      setType("sine");
      setBalance(0);
      setVolume(1);
      setBeepMode(false);
    }
  }, [hearing]);

  useEffect(() => {
    tones.stop();
    setPlaying(false);
  }, [beepMode]);

  // listen in localstorage
  useEffect(() => {
    window.addEventListener(
      "storage",
      () => {
        const raw = localStorage.getItem(localstorageKey);

        const number = parseFloat(raw).toFixed(2);

        console.log("trigger", number);

        const code = beepFunc(number, 200);

        trigger(() => (0, eval)(code));
      },
      false
    );
  }, []);

  function run() {
    if (beepMode) {
      trigger(() => (0, eval)(value));
    } else {
      if (playing) {
        tones.stop();
        setPlaying(false);
      } else {
        tones.play();
        setPlaying(true);
      }
    }
  }

  return (
    <div>
      <div>
        <label>
          hearing test:
          <input type="checkbox" checked={hearing} onClick={() => setHearing((v) => !v)} />
          {hearing && (
            <span style={{ color: "red" }}>
              test using builtin mac speakers on the max volume settings - BE CAREFUL THOUGH
            </span>
          )}
        </label>
      </div>
      <div className="mode">
        <span>mode:</span>
        <label>
          <input type="radio" name="mode" checked={beepMode === true} onChange={() => setBeepMode(true)} />
          beep
        </label>
        <label>
          <input type="radio" name="mode" checked={beepMode === false} onChange={() => setBeepMode(false)} />
          continuous
        </label>
      </div>
      <div className="other">
        <label>
          <span>frequency:</span>
          <input
            type="range"
            min={hearing ? hearingStart.test : hearingStart.normal}
            max={hearingStart.max}
            step="1"
            value={frequency}
            autoComplete="off"
            onChange={(e) => setFrequency(e.target.value)}
          />
          {frequency} Hz | min={hearing ? hearingStart.test : hearingStart.normal} max={hearingStart.max}
        </label>
        <br />
        <label>
          <span>volume:</span>
          <input
            disabled={hearing}
            type="range"
            min="0"
            max="100"
            step="1"
            value={volume}
            autoComplete="off"
            onChange={(e) => setVolume(e.target.value)}
          />
          {volumeCals}
        </label>
        <br />
        <label>
          <span>duration:</span>
          <input
            disabled={!beepMode || hearing}
            type="range"
            min="20"
            max="5000"
            step="1"
            value={duration}
            autoComplete="off"
            onChange={(e) => setDuration(e.target.value)}
          />
          {duration} ms
        </label>
        <br />
        <label>
          <span>balance:</span>
          <input
            disabled={beepMode || hearing}
            type="range"
            min="-100"
            max="100"
            step="1"
            value={balance}
            autoComplete="off"
            onChange={(e) => setBalance(e.target.value)}
          />
          <span style={{ display: "inline-block", width: "60px" }}>{balance / 1000}</span>
          <button onClick={() => setBalance(defaults.balance)}>reset</button>
        </label>
        <br />
        <div className="radio">
          {types.map((m) => (
            <label key={m}>
              <input type="radio" name="type" checked={type === m} onChange={() => setType(m)} disabled={hearing} />
              <img src={`svg/${m}-inkscape-OPTIMISED-MANUALLY.svg`} className="type" />
              {m}
            </label>
          ))}
        </div>
        <br />
        <div className="notes">
          {Object.entries(notes).map(([key, value]) => (
            <>
              <button
                disabled={hearing}
                key={value}
                className={classnames({
                  blue: noteMatch.test(key),
                })}
                onClick={() => {
                  console.log(key, value);

                  const code = beepFunc(value, 200);

                  trigger(() => (0, eval)(code));

                  setFrequency(value);
                }}
              >
                {key}
              </button>
              {noteEnd.test(key) && <br />}
            </>
          ))}
        </div>
        <br />
        <table width="90%">
          <tbody>
            <tr>
              <td>
                {/* <textarea value={value} /> */}
                <Ace id="ace" content={value || ""} lang="javascript" wrap={false} />
              </td>
              <td width="15%" valign="top">
                {beepMode ? (
                  <button onClick={run}>run</button>
                ) : (
                  <button onClick={run}>{playing ? `stop` : "play"}</button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          based on: <a href="https://stackoverflow.com/a/41077092">https://stackoverflow.com/a/41077092</a> &{" "}
          <a href="https://www.szynalski.com/tone-generator/#support">
            https://www.szynalski.com/tone-generator/#support
          </a>
        </p>
      </div>
    </div>
  );
};

render(<Main />, document.getElementById("app"));
