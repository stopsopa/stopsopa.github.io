# Documentation header - should be skipped

This is arbitrary markdown commentary and should be ignored by parser.

[plain link](./src/one.txt) -> [target one](./dest/one.txt)

Random note between lines

"src/spaced dir/file two.txt" -> [target two]("dest/spaced dir/file two.txt")

- list item to ignore
- another list item to ignore

./src/three.txt -> dest/three.txt

[label only with spaces](./src/four.txt) -> ./dest/four.txt

# Another heading

./src/five.txt -> [label five](./dest/nested/deep/five.txt)
