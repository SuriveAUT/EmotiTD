# Changelog

Alle nennenswerten Änderungen an EMOTICORE TD werden hier festgehalten. Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionierung an [SemVer](https://semver.org/lang/de/).

## [0.1.0-alpha] — 2026-05-06

Erster spielbarer Stand. MVP der Kernschleife steht.

### Added

- Kernschleife: Wellen-Setup, Bauphase, Active Wave, Sieg- und Niederlage-Bedingung.
- **Neun Emotionsturm-Typen** mit eigenen Mechaniken: Anger (Splash), Sadness (Slow), Joy (Chain), Fear (Stun), Calm (Buff-Aura), Hope (Numb-Damage-Multiplier), Disgust (Poison + Armor-Shred), Guilt (Mark + Execute), Trust (Core-Shield + Anchor).
- Synergie-System (Resonanz) zwischen passenden Emotionen.
- Upgrade-Pfade A / B / C pro Turm.
- Targeting-Modi: First, Last, Strongest, Weakest, Fastest, Boss.
- **Zehn Gegner-Typen**: Doubtling, Panic Runner, Guilt Giant, Shame Swarm, Envy Leech, Burnout Brute, Void Wraith, Overthinker, Numb One und der Boss „The Spiral".
- WaveManager mit eskalierenden Wellen und Boss-Encounter.
- Emotional Balance / RunStats-Tracking pro Lauf.
- Partikel-Effekte und Pixi-Filter für Glow / Atmosphäre.
- **Zwei Maps**: *Fractured Mind* und *Silent Lake*.
- Szenen: Main Menu, Game, Settings, How To Play, Credits.
- HUD, Side Panel, Tower Bar.
- Interaktives Tutorial inklusive statischer How-To-Play-Übersicht.
- AudioManager mit Master-/SFX-/Music-Kanälen, Settings persistent über SaveManager (LocalStorage).
- Keyboard-Controls: `1`–`9` Auswahl, `Space` Welle starten, `P` Pause, `F` Speed-Toggle, `Esc` Cancel, `R` Restart.
- Responsive Canvas-Fit mit atmosphärischem Frame-Hintergrund.

### Build

- Vite-Produktionsbuild ohne Sourcemaps.
- `npm run typecheck` als separater Schritt sowie als Pre-Step von `npm run build`.
