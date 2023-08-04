import React, { useEffect, useState, useRef } from "react";

import { render } from "react-dom";

const types = ["sine", "square", "sawtooth", "triangle"];

const defaults = {
  frequency: 3000,
  volume: 0.5,
  duration: 1000,
  type: types[2],
};

const Main = () => {
  const ref = useRef();

  const [frequency, setFrequency] = useState(defaults.frequency);

  const [volume, setVolume] = useState(parseInt(defaults.volume * 100, 10));

  const [duration, setDuration] = useState(defaults.duration);

  const [type, setType] = useState(defaults.type);

  useEffect(() => {
    ref.current.addEventListener("click", () => ref.current.select());
  }, []);

  const volumeCals = parseFloat((volume / 100).toFixed(2));

  const value = `
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
    frequency: ${frequency},
    type: "${type}",
    duration: ${duration}
});

`;

  function run() {
    eval(value);
  }

  return (
    <div>
      <label>
        <span>frequency:</span>
        <input
          type="range"
          min="40"
          max="6000"
          step="1"
          value={frequency}
          autoComplete="off"
          onChange={(e) => setFrequency(e.target.value)}
        />
        {frequency} Hz
      </label>
      <br />
      <label>
        <span>volume:</span>
        <input
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
      <div className="radio">
        {types.map((m) => (
          <label key={m}>
            <input type="radio" name="type" checked={type === m} onChange={() => setType(m)} />
            {m}
          </label>
        ))}
      </div>
      <br />
      <table width="90%">
        <tbody>
          <tr>
            <td>
              <textarea ref={ref} value={value} />
            </td>
            <td width="15%" valign="top">
              <button onClick={run}>run</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p>based on: <a href="https://stackoverflow.com/a/41077092">https://stackoverflow.com/a/41077092</a></p>
    </div>
  );
};

render(<Main />, document.getElementById("app"));
