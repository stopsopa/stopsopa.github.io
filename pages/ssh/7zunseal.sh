
#
# Script to unpack and clean up back 7z file with keys
# just before running script to load one of them
# /bin/bash 7zunseal.sh \
#   --7z_file /Users/sdzialowski/.ssh/keys.7z \
#   --7z_del_dir /Users/sdzialowski/.ssh/keys -- \
#   /bin/bash /Volumes/WINSCP/ssh/ssh/add.sh firstkey secondkey
#

function quote {
  echo "$1" | sed -E 's/\"/\\"/g'
}

_CLEANOLD="0";

_GEN="gen"

_7ZIP_FILE=""
_7ZIP_DEL_DIR=""

PARAMS=""
_EVAL=""
while (( "$#" )); do
  case "$1" in
    --7z_file)
      _7ZIP_FILE="$2";
      shift 2;
      ;;
    --7z_del_dir)                        # optional
      _7ZIP_DEL_DIR="$2";
      shift 2;
      ;;
    --) # end argument parsing
      shift;
      while (( "$#" )); do          # optional
        if [ "$1" = "&&" ]; then
          PARAMS="$PARAMS \&\&"
          _EVAL="$_EVAL &&"
        else
          if [ "$PARAMS" = "" ]; then
            PARAMS="\"$(quote "$1")\""
            _EVAL="\"$(quote "$1")\""
          else
            PARAMS="$PARAMS \"$(quote "$1")\""
            _EVAL="$_EVAL \"$(quote "$1")\""
          fi
        fi
        shift;                      # optional
      done                          # optional if you need to pass: /bin/bash $0 -f -c -- -f "multi string arg"
      break;
      ;;
    -*|--*=) # unsupported flags
      echo "$0 error: Unsupported flag $1" >&2
      exit 1;
      ;;
    *) # preserve positional arguments
      if [ "$1" = "&&" ]; then
          PARAMS="$PARAMS \&\&"
          _EVAL="$_EVAL &&"
      else
        if [ "$PARAMS" = "" ]; then
            PARAMS="\"$(quote "$1")\""
            _EVAL="\"$(quote "$1")\""
        else
          PARAMS="$PARAMS \"$(quote "$1")\""
            _EVAL="$_EVAL \"$(quote "$1")\""
#          PARAMS="$(cat <<EOF
#$PARAMS
#- "$1"
#EOF
#)"
        fi
      fi
      echo "                PARAMS2>>$PARAMS<<"
      echo "                _EVAL 1>>$_EVAL<<"
      shift;
      ;;
  esac
done

trim() {
    local var="$*"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "$var"
}

PARAMS="$(trim "$PARAMS")"
_EVAL="$(trim "$_EVAL")"









if [ "${_7ZIP_FILE}" != "" ]; then

  if [ ! -f "${_7ZIP_FILE}" ]; then

    echo "${0} error: ${_7ZIP_FILE} doesn't exist or it is not a file"

    exit 1
  fi

  if [ "${_7ZIP_DEL_DIR}" = "" ]; then

    echo "${0} error: when -7z_file (${_7ZIP_FILE}) is specified then -7z_del_dir should be too"

    exit 1
  fi

  function trigger_traps {

      cat <<EEE
${0} removing: >${_7ZIP_DEL_DIR}<
EEE

    rm -rf "${_7ZIP_DEL_DIR}"
  }

  trap trigger_traps EXIT;

  (
    _7ZIP_FILE__DIR="$(dirname "${_7ZIP_FILE}")"

    _7ZIP_FILE__FILE="$(basename "${_7ZIP_FILE}")"

    cd "${_7ZIP_FILE__DIR}"

    cat <<EEE
${0} unpacking: >${_7ZIP_FILE__FILE}<
EEE

    7z x -snld "${_7ZIP_FILE__FILE}"

    if [ ! -d "${_7ZIP_DEL_DIR}" ]; then

      echo "${0} error: after unpacking -7z_file (${_7ZIP_FILE}) the -7z_del_dir (${_7ZIP_DEL_DIR}) should exist and it should be a directory"

      exit 1
    fi

    if [ "${?}" != "0" ]; then

      cat <<EEE
${0} unpacking
${0}
${0}  cd "${_7ZIP_FILE__DIR}"
${0}  7z x -snld "${_7ZIP_FILE__FILE}"
${0}
${0} failed
EEE

      exit 1
    fi
  )
fi









# set positional arguments in their proper place
eval set -- "$PARAMS"


















# then you can use $_EVAL like this:
eval $_EVAL
