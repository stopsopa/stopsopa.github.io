start:
	node server.js --port 7898 --log 15

build:
	/bin/bash pages/bookmarklets/compress.sh
	/bin/bash pages/kubernetes/compress.sh


