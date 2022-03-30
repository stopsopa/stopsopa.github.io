
start:
	/bin/bash dev.sh STOPSOPA_IO_FLAG

build:
	/bin/bash build.sh

testport:
	/bin/bash testport.sh

fix:
	yarn style:fix
