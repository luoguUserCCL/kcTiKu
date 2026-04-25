#!/bin/sh
set -e

# Fix permissions for data directory (volume mount point)
if [ -d "/app/data" ]; then
    # Create subdirectories if they don't exist
    mkdir -p /app/data/pools
    
    # Set ownership to nextjs user (uid 1001)
    chown -R 1001:1001 /app/data
fi

# Execute the main command as nextjs user
exec su-exec nextjs:nodejs "$@"
