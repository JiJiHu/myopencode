# AGENTS.md - mygame Local Server Setup

## Project Info
- **Name**: mygame (海贼小游戏合集)
- **Type**: Static HTML/CSS/JS website
- **Location**: /root/mygame/

## Build/Run Instructions

### Local Server Options
1. **Python HTTP Server** (recommended for quick setup):
   ```bash
   python3 -m http.server 11278
   ```

2. **Node.js http-server** (if available):
   ```bash
   npx http-server -p 11278
   ```

3. **Create a startup script** for convenience:
   ```bash
   #!/bin/bash
   cd /root/mygame
   python3 -m http.server 11278
   ```

## Testing
- Verify server: `curl http://localhost:11278`
- Check games: `curl http://localhost:11278/games/snake/snake.html`

## Notes
- This is a static site, no build process needed
- All games are self-contained HTML files
- Port must be exactly 11278 as requested
