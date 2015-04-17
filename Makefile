


start:
	/bin/bash dev.sh 

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
	/bin/bash node_modules/.bin/prettier --config prettier.config.cjs --check .

style_fix:
	/bin/bash node_modules/.bin/prettier --config prettier.config.cjs --write .

style_list:
	/bin/bash node_modules/.bin/prettier --config prettier.config.cjs --list-different .



# preprocessor:
# 	@node lib/preprocessor.js
