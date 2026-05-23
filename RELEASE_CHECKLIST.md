# EMOTICORE TD 0.1.0-alpha Release Checklist

Status: prepared for alpha release validation on 2026-05-07.

## Alpha Content

- [x] 2 maps: Fractured Mind, Silent Lake.
- [x] At least 9 towers: Anger, Sadness, Joy, Fear, Calm, Hope, Disgust, Guilt, Trust.
- [x] 10 enemies: Doubtling, Panic Runner, Guilt Giant, Shame Swarm, Envy Leech, Burnout Brute, Void Wraith, Overthinker, Numb One, The Spiral.
- [x] Standard run ends at Wave 30.
- [x] Endless mode is available after standard victory.
- [x] Main Menu exists with map select, start, how-to, settings, credits and reset save.
- [x] Tutorial exists for first-run onboarding.
- [x] Settings exist for audio, quality, screen shake and auto-start.
- [x] Save and highscore persist through LocalStorage.
- [x] Run Summary is shown after victory and defeat.
- [x] Boss Intro appears on boss waves.
- [x] Defeat Window is shown through the side panel with run summary.

## UI Checks

- [x] Tower bar checked for 9 towers: 9 buttons fit before controls and the right panel at 1280x800.
- [x] How To Play explains all 9 tower roles in the Tower Roles reference.
- [ ] Full manual browser smoke test on a clean save.
- [ ] Audio pass with final music and SFX assets.

## Build Gates

- [x] `npm run typecheck`
- [x] `npm run build`

## Release Notes

- [x] README reflects the alpha content.
- [x] Changelog includes `0.1.0-alpha`.
- [x] Known Issues document exists.
