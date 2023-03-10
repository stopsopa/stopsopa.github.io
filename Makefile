


start:
	/bin/bash start.sh 

.PHONY: build
build:
	/bin/bash build.sh

testport:
	/bin/bash testport.sh

test:
	/bin/bash test.sh	

.PHONY: testall
testall:
	/bin/bash testall.sh	


# prettier
style_check:
	node node_modules/.bin/prettier --config prettier.config.cjs --check .

style_fix:
	node node_modules/.bin/prettier --config prettier.config.cjs --write .

style_list:
	node node_modules/.bin/prettier --config prettier.config.cjs --list-different .



# preprocessor:
# 	@node lib/preprocessor.js
