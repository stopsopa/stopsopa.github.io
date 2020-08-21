
start: stop
	/bin/bash bash/proc/start.sh ../../.env PROJECT_NAME /bin/bash run.sh

stop:
	/bin/bash bash/proc/kill.sh ../../.env PROJECT_NAME

status:
	/bin/bash bash/proc/status.sh ../../.env PROJECT_NAME

build:
	/bin/bash pages/bookmarklets/compress.sh
	/bin/bash pages/kubernetes/compress.sh


