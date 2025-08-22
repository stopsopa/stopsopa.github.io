To control color of the output for xx look for code block

```js
...
      theme: {
        style: {
          highlight: (text) => `${c.Reverse}${text}${c.reset}`, // inverse colors using your defined constants
        },
      },
...

```
