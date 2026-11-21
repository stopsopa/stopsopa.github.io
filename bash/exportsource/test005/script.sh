#!/bin/bash
source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../self.sh"
echo "script: _SHELL=${_SHELL} _DIR=${_DIR} _0=${_0} _SCRIPT=${_SCRIPT} _BINARY=${_BINARY}"
