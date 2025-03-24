export default function createScript(script, parent) {
  if (!parent) {
    parent = document.body;
  }
  const s = document.createElement("script");
  s.type = "module";
  s.textContent = script;
  parent.appendChild(s);
}
