
# how to use tools in this directory

```bash

# start socket broker - you can add more options here:

NODE_OPTIONS= SOCKET=var/socket.sock node socket/broker.ts
  # this is btw interactive - you can pass some messages in the terminal

# that is most important part - first you have to have broker working, 
# after that you can interact with that data bus you've just created  

# you can run server listening to that socket in another terminal
NODE_OPTIONS= HOST=0.0.0.0 PORT=8080 SOCKET=var/socket.sock node socket/node/server.ts

# we can also subscribe in another terminal
NODE_OPTIONS= SOCKET=var/socket.sock node socket/node/subscribe.ts
    # or demo as a library in another terminal
    NODE_OPTIONS= SOCKET=var/socket.sock  /bin/bash socket/bash/subscribeDemo.sh

# then we can send some events from the server and using:

printf "
first line
\e[32msecond\e[0m line
\e[33mthird\e[0m line
\e[35mfourth\e[0m line
\e[31mfifth\e[0m line
last line
" | perl -pe "system 'sleep .03'" | SOCKET=var/socket.sock /bin/bash socket/bash/pipe.sh



```

