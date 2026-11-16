
I need a tool which I will call like this

```bash

node bash/hardlink.ts ./path/to/config.md

```

don't worry about transpilation. I will use node.js in native stable typestripping mode.

when calling this tool we will first check if file config.md is given and if it exist and is file. and is readable.
if any of these checks fail we will exit with error code 1 and clear error message on stderr indicating what is wrong.

when calling this tool the we will extract links from config.md

we will look for format like this

```markdown


[one](./lib/test.ts) -> [two](./bin/test.ts)
[one](./node_modules/some_lib/test.ts) -> [two](somewhere else/test.ts)
path/to/file.log -> [two](./bin/path/to/file2.log)

[one](./test/ttt.sh) -> ./test/ttt2.sh

"path/with/ spaces /file log.log" -> [two](./bin/path/with/ spaces /file log2.log)

~/.test/ttt.sh -> [in home user](./test/ttt2.sh)



```

so as you can see empty lines are allowed in our md file

then we define pairs of paths to files separeated by \s+->\s+ and generally our script hardlink will look for these lines in this format

so there should be path on the left and path on the right.

both paths can be defined in either plane text or in markdown link format like [name](path/to/file)
where label for link doesn't really matter, it is just for human readability. as a label for given path for the operator. 

we can also use quotes for paths with spaces in them, so we can have "path/with/ spaces /file log.log" -> [two](./bin/path/with/ spaces /file log2.log)


in our format we can also have ~ indicating home directory, our script will expand ~ to home directory of the user running the script.

all paths should be resolved relative to the location of the config.md file unless param --pwd is given  then we would resolve paths relative to current working directory where we called the script.


Also we can pass --pwd [resolved path] then we specify exactly what path we want to use as pwd.

matter of what is the directory we will all paths resolve to should be resolved at the top of the script just after imports

resolution paths should be presented immediately on stdout with reason why this or that path was used -> indicating reason why given path was used. if it was just config.md location or --pwd as current working directory or explicitly given path in --pwd param.

# validation phase

after that we will extract all pairs of paths from config.md and first we will run validateion:
(for further discussion from now on let's indicate first path in each pair as path A and second path in each pair as path B)

```txt
- we will check if something exist under path A (it has to exist, if nothing is there then error)
- check the thing under path A is a file
- check if file A is readable
if all checks about file A are ok only then continue all checks for path B:
    - check if something exist under path B -> 
        only if it does then run some more tests:
            - check if file B is a file
            - VERY IMPORTANT: check if file A and file B are are hardlinks to the same inode if yes then skip further checking and move on to next line in config.md - all is good
            - check if file B is readable
            - check if file B is writable (if I have rights to remove it and create new hardlink in its place)
            - check if file A and file B have the same content (if they don't then error)
        when file B doesn't exist:
            - check if parent directory of file B exist
            - check if parent directory of file B is writable (if I have rights to create new hardlink in this directory)
            if directory doesn't exist then check if we have rights to create it
```

none of these checks above should change anything, these are just checks checking if we have all rights to do what we want to do. before we start executing the changes.
If any condition is not met then generate clear error message with involved path and state the clear error message.
and exit with error code 1

Generate error for each line in config.md and go through all found lines in config.md and check them separately. 

Only when all conditions are met then continue the logic. if even one condition is not met then exit 1 after printing all errors.

when printing errors follow this format:

```

File A [./path/as is in the config.md] error:
   [error message]

File A [./path/as is in the config.md] error:
   [error message]

File B [./path/as is in the config.md] error:
   [error message]

.. and so on   

```

# execution phase
once we go through the validation we will start doing actuall work:

if file B exist:
   - check if file A and file B are hardlinks to the same inode if yes, then just skip this line form config.md and move on to next line in config.md
   - if file A and file B are not hardlinks to the same inode then we know from validation phase that contents of file A and file B are the same because we wouldn't reach this point if they were not the same. in that case remove file B and create hardlink from file A to file B
if file B doesn't exist:
    - make sure parent directory of file B exist, if not then create it
    - create hardlink from file A to file B

create logic of bash/hardlink.ts in the way to reflect with if/else conditions the logic of validationa as presented in this document. The same phase of exection carry to each condition and if/else block the comment from this document to the source code to make it clear what piece of logic is implemented in each if/else block.

also when iterating through each line in config.md first present the line from config.md as is in stdout and under it with indentation present the action taken on each. Make lines which actually made any changes to be proceded with "CHANGED" prefix and print this prefix in green color when interactive stdout tty detected.
At the end of each synchronization operation (both for newly created hardlinks, replaced hardlinks, and already linked files), always present the final inodes of file A and file B as proof that both files are hardlinked to the same inode.

# testing

Create separate test to cover as much logic as possible with tests in bash/file/hardlink/tests directory. For each test create new subdirectory [001] then [002], [003] and so on. In each of these subdirectores create separate test.sh which will drive the logic.
Next to each test.sh create config.md and call hardlink.ts in the way to point it to that config.md. Test in first tests chaning resolution directory with different ways. Create any formation of files in given [subdirectory]/\d+/ directory whatever is needed for given test. 

call each [subdirectory]/\d+/test.sh in sequence one after another in main bash/file/hardlink/test.sh

this way we will be able to just call bash/file/hardlink/test.sh and it will run all tests in sequence.

any test fails it should exit 1 with clear message - ideally generated by hardlink.ts itself. If all tests pass then exit 0.

## Test Cases Overview:
- `001`: Basic hardlink creation when file B does not exist, default resolution to config.md directory.
- `002`: Replace existing file B (with identical content to file A, but different inode) with hardlink to file A.
- `003`: Validation failure when file B already exists and is not hardlinked to file A, but content differs from file A.
- `004`: Quoted paths with spaces and `--pwd` override pointing to explicit path.
- `005`: Deep config (`sub/deep/config.md`) using `--pwd` without path argument to resolve relative to current working directory (`process.cwd()`).
- `006`: Config using `--pwd <path>` pointing to a custom external directory.
- `007`: Validation failure when path B exists but is a directory rather than a regular file.
- `008`: Validation failure when path A does not exist.
- `009`: `--gitignore <path>` with delimiters `# hardlink.ts vvv` and `# hardlink.ts ^^^`, computing path relative to gitignore when config and work directories are located elsewhere.
- `010`: `--gitignore <path>` without delimiters, appending relative path B to the end of gitignore.
- `011`: Comprehensive test using all features together (various path formats, markdown comments/blank lines skipped, `--pwd <path>` redirection, deep `.gitignore` updates, and full inode validation).

# help page

script when called with --help or without path to config should geneate help page and exit 1

help page should present all the ways config.md can present pair of the paths 


# update gitignore

I would like this program to also accept --gitignore [path to gitignore]

and the idea is to always make sure file B is added to that gitignore

We have to make sure path to file B in that gitignore is relative to that gitignore file

and also in gitignore look for block

```

# hardlink.ts vvv
link/to/file.ts
# hardlink.ts ^^^

```

and search in gitignore for these two `# hardlink.ts vvv` and `# hardlink.ts ^^^` and add new path if missing between the two

if either of these delimiters are not present then just append new path to gitignore

The script must explicitly report and talk on stdout regarding gitignore updates:
- when entries are added, state that gitignore was changed and list each added entry with a `+ ` prefix (proceeded with green `CHANGED` when interactive tty).
- when all entries are already present in gitignore and nothing needs to be added, explicitly report that no changes were made and gitignore is already up to date.

make sure to generate tests cases for that. Make these tests to use --pwd with config in different location than resolved files and with .gitignore somewhere even higher but still in given test directory to see how it generates relative paths in gitignore

also update help page explaining --gitignore param and delimiters

also extend PLAN.md with new  description of new tests

# unlink

we have to add also --unlink flag which cannot work with --gitignore flag

and it will just iterate over config.md and find all matching files and just check if both file A and file B exist, then it will check if these are hardlinks and it will unlink

this mode have to be very leanient, what I mean is
it will just iterate and only try to unlink when both files exist and if one of them doesn't exist or one of paths is a directory or any other anomaly then just skip that line

report on stdout only what was unlinked