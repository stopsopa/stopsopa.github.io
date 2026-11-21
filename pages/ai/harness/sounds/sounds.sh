#!/bin/bash

# TUI to audition macOS sounds.
#
#   ↑/↓ (or k/j)   move          PgUp/PgDn  jump        g/G  first/last
#   Space          play only (preview)
#   Enter          play, print "afplay <path>" on STDOUT and exit
#   q / Esc        quit without printing
#
# The UI is drawn on /dev/tty, so stdout carries only the final command:
#
#   CMD="$(/bin/bash pages/ai/harness/sounds/sounds.sh)"; echo "$CMD"

if [ "$(uname)" != "Darwin" ]; then
  echo "macOS only (needs afplay)" >&2
  exit 1
fi

if ! { : </dev/tty; } 2>/dev/null; then
  echo "no TTY available" >&2
  exit 1
fi

DIRS=(
  "/System/Library/Sounds"
  "/Library/Sounds"
  "$HOME/Library/Sounds"
  "/System/Library/Components/CoreAudio.component/Contents/SharedSupport/SystemSounds"
)

PATHS=()
NAMES=()
for d in "${DIRS[@]}"; do
  [ -d "$d" ] || continue
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    PATHS+=("$f")
    rel="${f#$d/}"
    NAMES+=("$rel")
  done < <(find "$d" -type f \( -iname '*.aiff' -o -iname '*.aif' -o -iname '*.wav' -o -iname '*.caf' -o -iname '*.mp3' -o -iname '*.m4a' \) | sort)
done

COUNT=${#PATHS[@]}
if [ "$COUNT" -eq 0 ]; then
  echo "no sounds found" >&2
  exit 1
fi

SEL=0
TOP=0
PLAY_PID=""

ESC=$'\033'

cleanup() {
  [ -n "$PLAY_PID" ] && kill "$PLAY_PID" 2>/dev/null
  printf '%s[?25h%s[?1049l' "$ESC" "$ESC" >/dev/tty
  stty "$OLD_STTY" </dev/tty 2>/dev/null
}

OLD_STTY="$(stty -g </dev/tty)"
trap cleanup EXIT
trap 'exit 130' INT TERM

printf '%s[?1049h%s[?25l' "$ESC" "$ESC" >/dev/tty
stty -echo -icanon min 1 time 0 </dev/tty

play() {
  [ -n "$PLAY_PID" ] && kill "$PLAY_PID" 2>/dev/null
  afplay "${PATHS[$1]}" >/dev/null 2>&1 &
  PLAY_PID=$!
}

draw() {
  local rows cols visible i line out
  rows=$(stty size </dev/tty | cut -d' ' -f1)
  cols=$(stty size </dev/tty | cut -d' ' -f2)
  visible=$((rows - 4))
  [ "$visible" -lt 1 ] && visible=1

  [ "$SEL" -lt "$TOP" ] && TOP=$SEL
  [ "$SEL" -ge $((TOP + visible)) ] && TOP=$((SEL - visible + 1))

  out="${ESC}[H${ESC}[2J"
  out+="${ESC}[1mmacOS sounds${ESC}[0m  ($((SEL + 1))/$COUNT)"$'\n'
  out+="${ESC}[2m↑/↓ move · Space play · Enter play+print+exit · q quit${ESC}[0m"$'\n\n'

  for ((i = TOP; i < TOP + visible && i < COUNT; i++)); do
    line="${NAMES[$i]}"
    if [ "$i" -eq "$SEL" ]; then
      out+="${ESC}[7m> ${line}${ESC}[0m"
    else
      out+="  ${line}"
    fi
    out+=$'\n'
  done

  out+="${ESC}[${rows};1H${ESC}[2mafplay ${PATHS[$SEL]}${ESC}[0m"
  printf '%s' "$out" >/dev/tty
}

readkey() {
  local k rest
  IFS= read -rsn1 k </dev/tty
  if [ "$k" = "$ESC" ]; then
    # arrow keys / PgUp / PgDn send more bytes; bare Esc sends none
    rest=""
    IFS= read -rsn2 -t 1 rest </dev/tty
    if [ "$rest" = "[5" ] || [ "$rest" = "[6" ]; then
      local tilde
      IFS= read -rsn1 -t 1 tilde </dev/tty
    fi
    case "$rest" in
      "[A") KEY=up ;;
      "[B") KEY=down ;;
      "[5") KEY=pgup ;;
      "[6") KEY=pgdn ;;
      "") KEY=quit ;;
      *) KEY=other ;;
    esac
    return
  fi
  case "$k" in
    k) KEY=up ;;
    j) KEY=down ;;
    g) KEY=first ;;
    G) KEY=last ;;
    q) KEY=quit ;;
    " ") KEY=space ;;
    "") KEY=enter ;;
    *) KEY=other ;;
  esac
}

RESULT=""
while true; do
  draw
  readkey
  case "$KEY" in
    up) [ "$SEL" -gt 0 ] && SEL=$((SEL - 1)) ;;
    down) [ "$SEL" -lt $((COUNT - 1)) ] && SEL=$((SEL + 1)) ;;
    pgup) SEL=$((SEL - 10)); [ "$SEL" -lt 0 ] && SEL=0 ;;
    pgdn) SEL=$((SEL + 10)); [ "$SEL" -ge "$COUNT" ] && SEL=$((COUNT - 1)) ;;
    first) SEL=0 ;;
    last) SEL=$((COUNT - 1)) ;;
    space) play "$SEL" ;;
    enter)
      play "$SEL"
      RESULT="afplay ${PATHS[$SEL]}"
      # let the sound finish so it is audible before we exit
      [ -n "$PLAY_PID" ] && wait "$PLAY_PID" 2>/dev/null
      PLAY_PID=""
      break
      ;;
    quit) break ;;
  esac
done

if [ -n "$RESULT" ]; then
  # restore the terminal first, then print (trap cleanup runs again harmlessly)
  cleanup
  trap - EXIT
  echo "$RESULT"
fi
