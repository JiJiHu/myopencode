# Use nginx:alpine for lightweight static file serving
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/

# Copy root static files to nginx html directory
COPY index.html onepage-home.css onepiece-theme.css /usr/share/nginx/html/
COPY manifest.json sw.js /usr/share/nginx/html/
COPY images/ /usr/share/nginx/html/images/

# Copy games directory (contains all game HTML/CSS/JS files)
COPY games/ /usr/share/nginx/html/games/

# Add health check using 127.0.0.1 (IPv4) instead of localhost
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
