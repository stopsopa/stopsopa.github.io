import path from 'path';

const [root, target] = process.argv.slice(2);

if (root === undefined || target === undefined) {
  process.exit(1);
}

const relativePath = path.relative(root, target);

process.stdout.write(relativePath);
