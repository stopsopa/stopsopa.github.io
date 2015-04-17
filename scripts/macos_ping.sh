#!/bin/bash

# 
# Run it like so:
#    ./scripts/macos_ping.sh macos_ping_sh
# 
# mounted in /Users/xxxx/.any_shell_common.sh
# with
#  (cd "${REPO_DIR}/scripts/" && /bin/bash macos_ping.sh macos_ping__sh &)
#
# To find process:
#   ps aux | grep bash | grep macos | grep -v grep
# Then kill it and then open new terminal then ~/.any_shell_common.sh
# will open it again
# 

# Configuration
CHECK_INTERVAL=5        # Seconds between checks
HOST_TO_PING="8.8.8.8"  # Google DNS
PS_AUX_FLAG="macos_ping__sh"

log() {
    printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

if ps aux | grep "${PS_AUX_FLAG}" | grep -v grep | grep -v $$ > /dev/null; then
    log "${0}: Internet Status Monitor already running, exiting"
    exit 1
else
    log "${0}: Internet Status Monitor starting"
fi

IS_SECONDS_ON=$(defaults read com.apple.menuextra.clock ShowSeconds 2>/dev/null)
FAIL_COUNT=0

while true; do
    # Check for internet connection
    if ping -c 1 -W 1 "${HOST_TO_PING}" &> /dev/null; then
        # --- ONLINE STATE ---

        # Only log when recovering from failures.
        if [ "${FAIL_COUNT}" -gt 0 ]; then
            log "Internet connectivity restored"
        fi

        FAIL_COUNT=0

        if [ "${IS_SECONDS_ON}" != "1" ]; then
            log "Switching menu clock seconds ON"
            defaults write com.apple.menuextra.clock ShowSeconds -bool true
            # HUP tells Control Center to reload config without restarting
            killall -HUP ControlCenter
            IS_SECONDS_ON=1
        fi
    else
        # --- OFFLINE STATE ---

        ((FAIL_COUNT++))

        # Optional: only log the first failed ping.
        if [ "${FAIL_COUNT}" -eq 1 ]; then
            log "Ping failed"
        fi

        if [ "${FAIL_COUNT}" -ge 3 ] && [ "${IS_SECONDS_ON}" != "0" ]; then
            log "Internet appears offline (3 consecutive failures), switching menu clock seconds OFF"
            defaults write com.apple.menuextra.clock ShowSeconds -bool false
            killall -HUP ControlCenter
            IS_SECONDS_ON=0
        fi
    fi

    sleep "${CHECK_INTERVAL}"
done