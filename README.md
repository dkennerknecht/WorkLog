# WorkLog V1

Next.js App Router WebApp für Kiosk-Erfassung (`/kiosk`), optional Desktop-Wizard (`/wizard`) und Management (`/admin`) mit Prisma + SQLite.

## Stack
- Next.js 16 + TypeScript + App Router
- Tailwind CSS (TailAdmin-orientierter Stil)
- Route Handlers (`src/app/api/**`)
- Prisma + SQLite
- Frontend-Wizard-State über React Context

## Schnellstart
1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
2. DB-Schema anwenden:
   ```bash
   npm run db:push
   ```
3. Initialdaten (Tätigkeiten, Personen, Orte, Admin) seeden:
   ```bash
   npm run db:seed
   ```
4. Dev-Server starten:
   ```bash
   npm run dev
   ```
5. Öffnen:
   - Kiosk: `http://localhost:3000/kiosk`
   - Wizard: `http://localhost:3000/wizard`
   - Admin: `http://localhost:3000/admin/login`
   - Theme-Settings (nach Login): `http://localhost:3000/admin/settings`

## Default-Login
- Benutzer: `admin`
- Passwort: `admin123`

Ändern über `.env`:
```env
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-me"
```

## Tests
```bash
npm test
```

## Projektstruktur (gekürzt)
```text
src/
  app/
    (capture)/kiosk/*
    (capture)/wizard/*
    admin/(protected)/*
    api/*
  components/
    ui/*
    wizard/*
    admin/*
  config/
    master-data.ts
  features/wizard/*
  lib/*
  server/*
prisma/
  schema.prisma
  seed.mjs
```

## Zentrale, erweiterbare Listen-Konfiguration
Feste Startwerte liegen in:
- `src/config/master-data.ts`

Diese Werte werden beim Seed in SQLite geschrieben und können später über `/admin` gepflegt werden (Soft-Disable statt Hard Delete).

## Verhalten
- Keine Zukunftstage auswählbar im Wizard
- Schrittüberspringen verhindert (Guard auf ersten ungültigen Schritt)
- `Next` nur aktiv bei validem Schritt
- Soft-Delete für Stammdaten (`isActive`)
- Eintragsbearbeitung erzeugt neue Version (`EntryVersion`), Historie bleibt konsistent

## Raspberry Pi Kiosk (Kurz)
Produktivstart:
```bash
npm run build
npm run start -- -H 0.0.0.0 -p 3000
```
Chromium im Kiosk-Modus auf `/kiosk`, Remote-Management im LAN auf `/admin`.

## Docker

### 1. Container bauen und starten
```bash
docker compose up -d --build
```

Die App läuft danach auf:
- `http://localhost:3000/kiosk`
- `http://localhost:3000/admin/login`

### 2. Logs prüfen
```bash
docker compose logs -f app
```

### 3. Stoppen
```bash
docker compose down
```

### 4. SQLite-Datenpersistenz
- Die SQLite-Datei liegt im Docker-Volume `worklog-data` unter `/app/data/dev.db`.
- Beim ersten Start wird die DB automatisch initialisiert (`prisma db push`) und automatisch geseedet.
- Bei bestehenden Daten wird Seed standardmäßig übersprungen (`RUN_DB_SEED=auto`).

### 5. Seed-Verhalten steuern
- Immer seeden:
  ```bash
  RUN_DB_SEED=true docker compose up -d --build
  ```
- Nie seeden:
  ```bash
  RUN_DB_SEED=false docker compose up -d --build
  ```
