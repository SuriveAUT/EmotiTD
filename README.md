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
