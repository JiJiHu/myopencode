#!/bin/bash

# Health Monitor for mygame Docker container
# Checks service health every 60 seconds and logs status

URL="http://150.40.177.181:11278"
LOG_FILE="/root/mygame/health-check.log"
CHECK_INTERVAL=60

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

while true; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$URL" 2>/dev/null)
    
    if [ "$HTTP_CODE" = "200" ]; then
        log "STATUS: OK - Service is healthy (HTTP $HTTP_CODE)"
    else
        log "STATUS: ALERT - Service is DOWN! (HTTP $HTTP_CODE)"
    fi
    
    sleep $CHECK_INTERVAL
done
