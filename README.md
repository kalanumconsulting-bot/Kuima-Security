# Kuima Security Services Ltd (PNG) — Node.js v13.14.0 Compatible Package

Rebuilt specifically for **Node.js v13.14.0** (no ES2020 `?.` or `??` syntax in dependencies or server code, and zero native C++ `sqlite3` compilation issues).

## Included Features
- **All 11 Separated Pages (`public/`)** + **All 7 Authentic Kuima Security Photos (`public/assets/img/`)**
- **Persistent Operations Store (`data/kuima_operations.json`)**: Auto-initializes on startup with starter client accounts (`POM-COMP-04`, `UNITECH-01`, `POM-TAURAMA` / PIN `123456`)
- **Production Client Portal (`/client-portal.html`)**: Hashed PIN login (`bcryptjs`), sessions (`express-session`), shift & NFC patrol logs, and live site instructions
- **24/7 Control Room Admin Console (`/admin.html`)**: Login `controlroom` / `KuimaAdmin2026!`

## How to Run on Node v13.14.0
1. Extract this ZIP folder.
2. Open a terminal inside `kuima-security-services-node13`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open `http://localhost:3000` in your browser.
