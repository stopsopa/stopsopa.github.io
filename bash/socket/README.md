# how to use tools in this directory

```bash

# start socket broker - you can add more options here:

NODE_OPTIONS= SOCKET=var/socket.sock node socket/broker.ts
  # this is btw interactive - you can pass some messages in the terminal
  # NOTE: read about it's lifecycle, if process fails it will remove socket file
  #       and when we start it again it will create socket file again. Just work with that

# that is most important part - first you have to have broker working,
# after that you can interact with that data bus you've just created

```

# then you can interact with the socket

```bash

# you can run server listening to that socket in another terminal
NODE_OPTIONS= HOST=0.0.0.0 PORT=8080 SOCKET=var/socket.sock node bash/socket/server.ts

# we can also subscribe in another terminal
NODE_OPTIONS= SOCKET=var/socket.sock node bash/socket/subscribe.ts
  # FEATURE: this one can just sit there and survive restarts of the broker and not repeat the same message
  #          probably most useful of all tools in this directory
  # you can just launch it and restart broker ... you wouldn't do that but I'm trying to say it's resilient

    # or demo as a library in another terminal
    NODE_OPTIONS= SOCKET=var/socket.sock  /bin/bash bash/socket/subscribeDemo.sh

    # also we can prefilter events we will get
    SOCKET=var/socket.sock node bash/socket/subscribe.ts --regex "/^(abc|def)( .*)*\$/i"

# then we can send some events from the server and using:

printf "
first line
\e[32msecond\e[0m line
\e[33mthird\e[0m line
\e[35mfourth\e[0m line
\e[31mfifth\e[0m line
last line
" | perl -pe "system 'sleep .03'" | SOCKET=var/socket.sock /bin/bash bash/socket/pipe.sh


# so now when we have script which emits some lines we can use sed to prefix and pass down to the socket
cat <<EEE | perl -pe "system 'sleep .03'" | sed 's/^/event /' | nc -U var/socket.sock
./bash/node/is-port-free.ts
./bash/node/json/unwrap.ts
./bash/node/json/sortObjectNested.ts
./bash/node/versioncheck.ts
./bash/node/preamble.ts
./bash/fs/watch.ts
./bash/fs/relative.ts
./bash/fs/touchWatch.ts
./bash/tee.ts
./bash/git/addToGitignore.ts
./libs/drag_v2.ts
./libs/drag.ts
EEE


# ... and we can have something else at the same time passing something different
# so final reasult will be stream like
cat <<EEE | perl -pe "system 'sleep .03'" | nc -U var/socket.sock
transpile ./bash/node/is-port-free.ts
no_sandbox ./bash/node/json/unwrap.ts
transpile ./bash/node/json/sortObjectNested.ts
no_sandbox ./bash/node/versioncheck.ts
transpile ./bash/node/preamble.ts
no_sandbox ./bash/fs/watch.ts
transpile ./bash/fs/relative.ts
no_sandbox ./bash/fs/touchWatch.ts
transpile ./bash/tee.ts
no_sandbox ./bash/git/addToGitignore.ts
no_sandbox ./libs/drag_v2.ts
transpile ./libs/drag.ts
EEE

# and then we can subscribe with some other script to particular event

# do something
SOCKET=var/socket.sock node bash/socket/subscribe.ts --regex "/^transpile( .*)*\$/i" \
| IN=ts OUT=js /bin/bash bash/file/extswap.sh

# and after extswap we could pass it somewhere else and that thing could emmit new events
# and we could pick that up with something else .. and so on ..

# and that's how we have built event bus

# HINT:
# I would encourage to use some kind of prefix like 'soc_ev_*' to each event to be able to search globally in the project

```
