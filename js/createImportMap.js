export default function createImportMap(objectToJson, parent) {
  if (!parent) {
    parent = document.body;
  }
  const script = document.createElement("script");
  script.type = "importmap";
  script.textContent = JSON.stringify(objectToJson, null, 4);
  parent.appendChild(script);
}
