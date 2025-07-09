/**
 *  xx --lock
 *  node "${_DIR}/xx.lock.gits-update-config.node.bundled.gitignored.mjs" "${GITIGNORE}" "${_PWD}/.git/.gitignore_local"
 */
const fs = require("fs");

const path = require("path");

const gs = eval("require")("../../../gitstorage.cjs");

const log = console.log;

const pwd = process.argv[2];

const file = process.argv[3];

const gitignore_local = process.argv[4];

const ignore = process.argv[5];

const excludesFile = process.argv[6];

const ignoreList = ignore
  .split("\n")
  .map((r) => r.trim())
  .filter(Boolean)
  .map((r) => gs.trim(r, "./", "l"))
  .map((r) => `/${r}`);

const final = [];

const gitignore_local_absolute = path.resolve(pwd, gitignore_local);

let add = [];

let list;

if (fs.existsSync(gitignore_local_absolute)) {
  const gitignore_content = fs.readFileSync(gitignore_local_absolute, "utf8").toString();

  list = gitignore_content
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);

  add = ignoreList.filter((file) => !list.includes(file));
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

// {
//   pwd: '/Users/sdzialowski/Workspace/PEX_dev/GDCORP-ECOMM__catalog-ui-service/GDCORP-ECOMM__catalog-ui-service',
//   file: '.git/gitstorage-config.sh',
//   gitignore_local: '.git/.gitignore_local',
//   ignoreList: [
//     '/______package_______.json',
//     '/test/e2e/product-type-create.e2e.js',
//     '/playwright.config.js',
//     '/playwright-docker-defaults.sh',
//     '/playwright.sh'
//   ]
// }
// log({
//   pwd,
//   file,
//   gitignore_local,
//   ignoreList,
// });

function addToGitignoreLocal(file, list, existingList) {
  if (!Array.isArray(existingList)) {
    existingList = [];
  }

  const sorted = [...existingList, ...list];

  sorted.sort();

  fs.writeFileSync(file, sorted.join("\n") + "\n");
}
