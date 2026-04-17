#!/bin/bash

# 
# Run it like so:
#    ./scripts/macos_ping.sh macos_ping_sh
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

CURRENT_STATE=$(defaults read com.apple.menuextra.clock ShowSeconds 2>/dev/null)

while true; do
    # Check for internet connection
    if ping -c 1 -W 1 "${HOST_TO_PING}" &> /dev/null; then
        # --- ONLINE STATE ---        
        if [ "${CURRENT_STATE}" = "1" ]; then
            CURRENT_STATE=0
            defaults write com.apple.menuextra.clock ShowSeconds -bool true
            # HUP tells Control Center to reload config without restarting
            killall -HUP ControlCenter
        fi
    else
        # --- OFFLINE STATE ---        
        if [ "${CURRENT_STATE}" = "0" ]; then
            CURRENT_STATE=1
            defaults write com.apple.menuextra.clock ShowSeconds -bool false
            killall -HUP ControlCenter
        fi
    fi
    
    sleep "${CHECK_INTERVAL}"
done