# EMOTICORE TD

Emotional Tower Defense in WebGL. Du verteidigst einen psychischen Kern gegen Wellen aus Doubtlings, Burnouts und Spiralen — gebaut wird mit neun Emotionen als Türmen, balanciert über Resonanz und Synergien.

Stack: TypeScript, Vite, PixiJS v8.

## Setup

```bash
npm install
```

## Dev-Start

```bash
npm run dev
```

Startet den Vite-Devserver auf `http://127.0.0.1:5173`.

## Build

```bash
npm run build
```

Produktionsbuild nach `dist/`. Typecheck läuft als Pre-Step. Sourcemaps sind deaktiviert.

## Preview

```bash
npm run preview
```

Bedient den Build aus `dist/` lokal zum Gegenchecken vor dem Deploy.

## Typecheck

```bash
npm run typecheck
```

## Controls

| Eingabe       | Aktion                                |
| ------------- | ------------------------------------- |
| `1` … `9`     | Emotionsturm auswählen                |
| Linksklick    | Turm setzen / Turm selektieren        |
| Rechtsklick   | Platzierung abbrechen                 |
| `Esc`         | Auswahl / Selektion aufheben          |
| `Space`       | Welle starten                         |
| `P`           | Pause                                 |
| `F`           | Geschwindigkeit umschalten            |
| `R`           | Restart (nach Sieg / Niederlage)      |

## Status

**0.1.0-alpha** — spielbarer MVP. Kernschleife, neun Emotionen, Wellensystem, Synergien, Tutorial und zwei Maps stehen. Balancing, Audio-Feinschliff und weitere Inhalte folgen.

## Online Scoreboard

Das Frontend redet mit einem kleinen Express + SQLite Backend unter `server/`. Nach jedem
ausgespielten Run kann ein Name eingegeben und der Score eingereicht werden, im
Hauptmenü gibt es einen `SCOREBOARD`-Button für die Top 10 pro Map und Mode.

### Backend setup

```bash
cd server
npm install
npm run dev
```

Standardmäßig läuft der Server auf Port `3001`. Die SQLite-Datei liegt in
`server/data/scores.sqlite` und wird beim ersten Start angelegt.

`.env` (oder per Shell-Vars):

```
PORT=3001
ALLOWED_ORIGIN=http://localhost:5173
```

### Frontend env

`.env.development`:

```
VITE_API_BASE_URL=http://localhost:3001/api
```

`.env.production`:

```
VITE_API_BASE_URL=/api
```

### Endpoints (kurz)

- `GET  /api/health`
- `POST /api/scores` — body siehe `src/services/scoreboardApi.ts`
- `GET  /api/scores/:mapId?limit=10&mode=endless`
- `GET  /api/scores`

### Hinweis

Das Alpha-Scoreboard ist **trust-based** und kann jederzeit zurückgesetzt werden:
keine Accounts, kein Login, kein Anti-Cheat. Score-Submits validieren nur Format,
Länge und Rate (10 Submits/Minute/IP).

### Deployment

Frontend wird mit `tools/deploy-server.ps1` deployed. Das Backend läuft als
eigener Node-Prozess (z. B. via `pm2` oder `systemd`) auf Port 3001 und wird in
nginx unter `/api` durchgereicht (siehe README oben für Beispielkonfig).
