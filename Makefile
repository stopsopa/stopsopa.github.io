
start: stop testport
	/bin/bash bash/proc/start.sh ../../.env PROJECT_NAME /bin/bash run.sh
	/bin/bash prod.sh

stop:
	/bin/bash bash/proc/kill.sh ../../.env PROJECT_NAME

status:
	/bin/bash bash/proc/status.sh ../../.env PROJECT_NAME

build:
	node pages/portsregistry/lists/ports-generator.js
	/bin/bash pages/bookmarklets/compress.sh
	#/bin/bash pages/kubernetes/compress.sh

testport:
	/bin/bash testport.sh

