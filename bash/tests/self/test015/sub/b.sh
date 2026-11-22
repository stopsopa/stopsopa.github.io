source "$(dirname "${BASH_SOURCE[0]:-${(%):-%x}}")/../../../../self.sh" --map _DIR B_DIR _0 B_0
echo "b: B_DIR=${B_DIR-<unset>} B_0=${B_0-<unset>}"
b_func() {
  echo "b_func: B_DIR=${B_DIR-<unset>} B_0=${B_0-<unset>} A_0=${A_0-<unset>}"
}
