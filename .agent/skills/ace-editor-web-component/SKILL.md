---
name: ace-editor-web-component
description: Web component for printing code with syntax highlighting using ace editor.
---

# documentation

Documentation can be found https://stopsopa.github.io/ace-editor-webcomponent/learning/008_ace_async_loader/dynamic.html

generally this is web component which can be used like

```
<ace-editor lang="javascript" id="unique-id">
  <script type="ace">
    function greet(name) {
        console.log("Hello, " + name + "!");
    }

    greet("World");
  </script>
</ace-editor>

```

between tagx `<script type="ace">` and `</script>` you just place your code and pick the language in the `lang` attribute.
For full list of languages go to: https://github.com/ajaxorg/ace/blob/v1.43.4/src/ext/modelist.js#L72

# Installation

Normally before we will be able to use this web component we will have to run

```
<script
  type="module"
  src="https://stopsopa.github.io/ace-editor-webcomponent/ace-web-component.js"
  data-main-ace="https://stopsopa.github.io/ace-editor-webcomponent/noprettier/ace/ace-builds-1.43.4/src-min-noconflict/ace.js"
></script>
```

There is not npm package for this project. Because the only thing specific to this project is file https://stopsopa.github.io/ace-editor-webcomponent/ace-web-component.js

which can be just downloaded to this project we are building from there.
So installation is not needed. Just downloading this file.

data-main-ace on the other hand can point to any publicly available ace editor version.
We just have to point it to ace.min.js in particular place.

# theme

By default don't override theme="..." argument in web component. Leave default theme.

For the purpose of AI usage just stick to the example above. User will change path to ace.min.js manually.

# editing content in ace editor web component

Ace editor web component can be updated live by just finding editor in the DOM tree by id and updating it's content like so:

```

const editor = document.getElementById('programmatic-demo');

editor.setAttribute('lang', 'python');
editor.setAttribute('value', `# Python Example
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`);
```

example above also demonstrate how we can change language of the editor programatically

# waiting to be able to interact with editor

if there is need to interact programatically with ace editor then below will not work.

<code>
<ace-editor id="problematic-editor1">
  <script type="ace">
    // Initial function
    function greet(name) {
      console.log("Hello, " + name);
    }
  </script>
</ace-editor>

<!-- and then in javascript -->

<script>
  {
    const editor = document.getElementById('problematic-editor1');

    editor.value = editor.value + `
    console.log("Let's try to append this console.log");
    `;
  }
</script>
</code>

The reason is that this is web component and it have to by hydrated -> some scripts have to be loaded and logic aplied to "dress" the components to build them in the browser dom and make them ready to interact.

Therefore we have to have way to wait for it to happen, so this is how it can be done using onLoad event:


<code>

<ace-editor id="problematic-editor2">
  <script type="ace">
    // Initial function
    function greet(name) {
      console.log("Hello, " + name);
    }
  </script>
</ace-editor>

<!-- and then in javascript -->

<script>
  {
    const editor = document.getElementById("problematic-editor2");

    editor.addEventListener("onLoad", () => {
      editor.value =        `
console.log("Let's try to append this console.log");
  `;
    });
  }
</script>


</code>
