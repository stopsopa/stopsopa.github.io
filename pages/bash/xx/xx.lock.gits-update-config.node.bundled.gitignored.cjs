"use strict";

// pages/bash/xx/xx.lock.gits-update-config.node.cjs
var fs = require("fs");
var path = require("path");
var gs = eval("require")("../../../gitstorage.cjs");
var log = console.log;
var pwd = process.argv[2];
var file = process.argv[3];
var gitignore_local = process.argv[4];
var ignore = process.argv[5];
var excludesFile = process.argv[6];
var ignoreList = ignore.split("\n").map((r) => r.trim()).filter(Boolean).map((r) => gs.trim(r, "./", "l")).map((r) => `/${r}`);
var final = [];
var gitignore_local_absolute = path.resolve(pwd, gitignore_local);
var add = [];
var list;
if (fs.existsSync(gitignore_local_absolute)) {
  const gitignore_content = fs.readFileSync(gitignore_local_absolute, "utf8").toString();
  list = gitignore_content.split("\n").map((r) => r.trim()).filter(Boolean);
  add = ignoreList.filter((file2) => !list.includes(file2));
} else {
  final.push(`
  create .git/.gitignore_local file and register it with git

    cat <<EEE > .git/.gitignore_local
${ignoreList.join("\n")}    
EEE    
`);
  addToGitignoreLocal(gitignore_local_absolute, ignoreList, list);
}
if (excludesFile !== ".git/.gitignore_local") {
  final.push(`
  activate .git/.gitignore_local    

    git config core.excludesFile .git/.gitignore_local          
`);
}
if (ignoreList.length > 0) {
  const { added, match, lines } = gs.explode(pwd, file, "");
  const found = lines.find((row) => {
    return Array.isArray(row) && row[1].includes(".gitignore_local");
  });
  if (!found) {
    final.push(`
  add .git/.gitignore_local to .git/gitstorage-config.sh

    ".gitignore_local::$GITSTORAGETARGETDIR/.gitignore_local"
`);
  }
}
if (add.length > 0) {
  final.push(`
  adding to .git/.gitignore_local

${add.join("\n")}
`);
  addToGitignoreLocal(gitignore_local_absolute, add, list);
}
if (final.length > 0) {
  final.push(`
  run 
   gits diff
`);
  log(final.join(""));
} else {
  log(`
     All good lock mounted  

     run 
      gits diff
`);
}
function addToGitignoreLocal(file2, list2, existingList) {
  if (!Array.isArray(existingList)) {
    existingList = [];
  }
  const sorted = [...existingList, ...list2];
  sorted.sort();
  fs.writeFileSync(file2, sorted.join("\n") + "\n");
}
