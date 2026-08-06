
ls -la var/socket.sock

```
Won't really tell you if socket is active, it is just filesystem name pointing to kernel socket endpoint

It tells you:

    the filesystem entry exists
    it is a Unix socket inode

It does not tell you:

    whether a process is listening
    whether clients can connect
    whether the owning process is alive

```

how to check if it is active:

```
# try to connect to it

nc -U var/socket.sock

# if immediately exit 1 then it is inactive

```

# fuser

```
$ fuser var/socket.sock      (macOS usually does not have this.)
var/socket.sock: 20670

# means PID 20670 has it open. 

$ ps aux | grep 20670
szdz             20670   0.0  0.2 444533392  70176 s022  S+    8:59p.m.   0:00.13 /Users/.../node socket/broker.ts

```

# netstat

```
$ netstat -an | grep socket.sock
92df33a00bc41243 stream      0      0                0 3cbc532b6148f27d                0                0 var/socket.sock
da6a0f0b984d6282 stream      0      0 cb1c1da6e821b5cd                0                0                0 var/socket.sock
```