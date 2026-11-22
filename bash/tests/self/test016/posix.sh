# dash ignores arguments of "." - so here all variables are created
. "$(dirname "${0}")/../../../self.sh" --map _DIR __DIR
echo "source: __DIR=${__DIR-<unset>} _DIR=${_DIR-<unset>} _0=${_0-<unset>}"
# arguments of function work everywhere
_self --map _DIR X_DIR
echo "code=$?"
echo "_self: X_DIR=${X_DIR-<unset>}"
_self --map _NOPE X
echo "code=$?"
