# Homelab-Dash 

## what you need

### Web server such as apache2
### API for openweather https://openweathermap.org/api
### Proxmox api token but privilige sepration should be disabled (https://www.youtube.com/watch?v=wK8PUp7rjzs) 
### Your Pi-hole password

## Now your password and IP changes are needed in 3 js files

### 1. pi-hole.js, you will replace values at line 1 and line 3 which is your password and IP
### 2. your apache2 virtual host config change. You will change  /etc/apache2/sites-available/000-default.conf and replace IP 2.254 in my case with your proxmox IP
`<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html

    # Enable SSL for proxying HTTPS requests (moved outside <Location>)
    SSLProxyEngine On
    SSLProxyVerify none
    SSLProxyCheckPeerCN off
    SSLProxyCheckPeerName off

    # Allow access to the proxy
    <Proxy *>
        Require all granted
    </Proxy>

    # Proxy configuration for /api
    <Location /api>
        # Proxy requests from /api to Proxmox API
        ProxyPass https://192.168.2.254:8006/api2/json
        ProxyPassReverse https://192.168.2.254:8006/api2/json

        # CORS headers (optional for same-origin but useful for flexibility)
        Header set Access-Control-Allow-Origin "*"
        Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Header set Access-Control-Allow-Headers "Authorization, Content-Type"
    </Location>

    # Handle OPTIONS preflight requests for CORS
    RewriteEngine On
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^/api - [R=200,L]

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
`
##run these commands to enable mods
`sudo a2enmod dir
sudo a2enmod mime
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod ssl
sudo a2enmod headers`
