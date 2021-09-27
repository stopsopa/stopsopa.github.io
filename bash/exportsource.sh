
# https://unix.stackexchange.com/a/79065

# USAGE:
# eval "$(/bin/bash bash/exportsource.sh .env.test)"

#if [ ! -f "$1" ]; then
#
#  echo "$0 error: file '$1' doesn't exist"
#
#  exit 1 # can't do exit with eval - it will close terminal, or stop parent script
#fi

cat <<EOF

source "$1"

export $(cut -d= -f1 "$1" | grep -v -E "^#" | tr "\n" " ")

EOF
