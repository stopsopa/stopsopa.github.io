#!/bin/bash

# 
# Run it like so:
#    ./scripts/macos_ping.sh macos_ping_sh
# 
# mounted in /Users/xxxx/.any_shell_common.sh
# with
#  (cd "${REPO_DIR}/scripts/" && /bin/bash macos_ping.sh macos_ping__sh &)
# 

# Configuration
CHECK_INTERVAL=5        # Seconds between checks
HOST_TO_PING="8.8.8.8"  # Google DNS
PS_AUX_FLAG="macos_ping__sh"

if ps aux | grep "${PS_AUX_FLAG}" | grep -v grep | grep -v $$ > /dev/null; then
    echo "${0}: Internet Status Monitor already running..."
    exit 1
else
    echo "${0}: Internet Status Monitor starting..."
fi

IS_SECONDS_ON=$(defaults read com.apple.menuextra.clock ShowSeconds 2>/dev/null)
FAIL_COUNT=0

while true; do
    # Check for internet connection
    if ping -c 1 -W 1 "${HOST_TO_PING}" &> /dev/null; then
        # --- ONLINE STATE ---
        FAIL_COUNT=0
        if [ "${IS_SECONDS_ON}" != "1" ]; then
            defaults write com.apple.menuextra.clock ShowSeconds -bool true
            # HUP tells Control Center to reload config without restarting
            killall -HUP ControlCenter
            IS_SECONDS_ON=1
        fi
    else
        # --- OFFLINE STATE ---
        ((FAIL_COUNT++))
        if [ "${FAIL_COUNT}" -ge 3 ] && [ "${IS_SECONDS_ON}" != "0" ]; then
            defaults write com.apple.menuextra.clock ShowSeconds -bool false
            killall -HUP ControlCenter
            IS_SECONDS_ON=0
        fi
    fi
    
    sleep "${CHECK_INTERVAL}"
done
