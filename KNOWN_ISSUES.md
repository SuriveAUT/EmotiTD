# Known Issues

## Scoreboard

- Scoreboard ist Alpha und **trust-based**: kein Account-System, kein
  serverseitiges Anti-Cheat. Spieler können Scores faken, weil keine
  Run-Simulation am Server existiert.
- Datenbank kann jederzeit zurückgesetzt werden.
- Bei Backend-Ausfall fällt das Score-Submit silent zurück (Fehlermeldung im
  Overlay, Run-Summary bleibt lokal).
- Namen werden nur in Bezug auf Format / Länge geprüft; keine Profanity-Filter.
