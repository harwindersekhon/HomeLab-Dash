# Homelab-Dash 
### What you will need

- Linux container or vm debain based such as ubuntu 
- Apache2 web server package installed
- Little knowledge of linux commands to edit files and navigation
- You will need to signup at https://openweathermap.org/ for free api key for weather
- You know your pi hole password and IP
- You know your proxmox IP and created api token with enough privliges to read system status

### Creating proxmox token with correct priviliges is bit tricky so watch couple of youtube videos

### Step 1. Web server setup
- Ssh into your vm or lxc conatiner
- apt update -y && apt install apache2 -y
- Remove index.html file
```
cd /var/www/html
rm index.html
```
- Change virtual host config to make webserver act as reverse proxy 
```
cd /etc/apache2/sites-available/
```
- Edit **000-default.conf** file
- Use nano or vim to delete entire content of it
- Replace it with code below expect you need to **replace with your proxmox IP**
```
<VirtualHost *:80>
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
        ProxyPass https://<YOURIP>:8006/api2/json
        ProxyPassReverse https://<YOURIP>:8006/api2/json

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
```
- Enable mods using comands given 
```
sudo a2enmod dir;
sudo a2enmod mime;
sudo a2enmod rewrite;
sudo a2enmod proxy;
sudo a2enmod proxy_http;
sudo a2enmod ssl;
sudo a2enmod headers;
sudo systemctl restart apache2;
```
- Check modules are enabled
```
apache2ctl -M
```
- Now web server side is done

------------
### Asuming at this stage you already have 
- Openweather api key
- Proxmox token
- Pi Hole password

### Changing IPs and keys according to your system
# Proxmox 
- You already changed IP in 000-default.conf file under 
```
/etc/apache2/sites-available/
```
- Change proxmox.js file PROXMOX_API_TOKEN value, after =
```
const PROXMOX_API_TOKEN =  "PVEAPIToken=api@pam!token2=cc2597c-SOMETHING
```
# Weather
- **Edit weather.js**
- here change lat long and key
```
var lat = 43.XX //Example: New York latitude
  var lon = -79.XX// Example: New York longitude
  var apiKey = "XX"; // Replace with your OpenWeatherMap API key
  ```

#Pi hole
- Change following and ignore Line 2
```
const PIHOLE_BASE_URL = "http://YOUR_PIHOLE_IP"; // Replace with your Pi-hole IP, e.g., http://192.168.1.66
const API = `${PIHOLE_BASE_URL}/api`;
const PASSWORD = "XX"; // Replace XX with your Pi-hole password
```

