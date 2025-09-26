# Club Website

This repository contains the source code and configuration files for the Club Website project. It includes a web frontend, backend PHP scripts, a database, and Nginx configuration files.

## Project Structure

```
club_website/
├── private/
│   ├── clubWebsite.db           # SQLite database file
│   ├── DB schema.txt            # Database schema
│   ├── js/
│   │   ├── index.ts             # TypeScript source
│   │   └── tsconfig.json        # TypeScript config
│   └── php/
│       ├── api.php              # Main API endpoint
│       ├── email_entered.php    # Email entry handler
│       ├── get_csrf_token.php   # CSRF token generator
│       ├── include.php          # Common PHP includes
│       └── set_tz.php           # Timezone setter
├── public/
│   ├── favicon.ico              # Site favicon
│   ├── index.html               # Main HTML page
│   ├── css/
│   │   └── styles.css           # Stylesheet
│   └── js/
│       ├── index.js             # Compiled JS
│       └── index.js.map         # Source map
└── conf/
    ├── nginx.conf               # Nginx configuration
    ├── mime.types               # MIME types
    └── ...                      # Other config files
```

## Getting Started

### Prerequisites
- Nginx web server
- PHP (with SQLite support)
- Node.js & npm (for TypeScript compilation)

### Setup Instructions
1. **Clone the repository:**
   ```fish
   git clone <repo-url>
   ```
2. **Configure Nginx:**
   - Copy `conf/nginx.conf` to your Nginx config directory.
   - Adjust paths as needed.
3. **Install dependencies (TypeScript):**
   ```fish
   cd club_website/private/js
   npm install
   ```
4. **Build frontend JS:**
   ```fish
   npx tsc
   ```
5. **Set up the database:**
   - Use `DB schema.txt` to initialize `clubWebsite.db` if needed.

### Running the Website
- Start Nginx and ensure PHP is configured for FastCGI.
- Access the site via your configured domain or `localhost`.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
GPL (GNU General Public License)