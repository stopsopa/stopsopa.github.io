
_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
set -x

# https://youtu.be/Sx9zG7wa4FA?t=11756
cat "${_DIR}/people.csv" | cut -d , -f 3
# city
# New York
# Chicago
# Boston
# San Francisco

cat "${_DIR}/people.csv" | cut -d , -f 1,3
# name, city
# Alice, New York
# Bob, Chicago
# Charlie, Boston
# Dana, San Francisco

cat "${_DIR}/people.csv" | cut -d , -f 1-3 | tr , '\t'
# name     age     city
# Alice    30      New York
# Bob      25      Chicago
# Charlie  35      Boston
# Dana     28      San Francisco

cat "${_DIR}/complex.csv" | cut -d , -f 1-3 | tr , '\t'
# that won't work unfortunately, this is just comma separated values, not proper csv parsers
# name     age     city
# Alice    30      "New York
# Bob      25      Chicago
# Charlie  35      Boston
# Dana     28      San Francisco



