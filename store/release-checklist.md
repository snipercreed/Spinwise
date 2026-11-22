# Releasing Spinwise on Google Play

## Accounts and one-off costs
1. Create a Google Play developer account (one-time registration fee). New personal accounts must run a **closed test** with a minimum number of testers for a set period before production access; check the current rules in Play Console.
2. Decide the package name. It is `com.spinwise.app` and cannot be changed after publishing.

## Build
1. Push to GitHub. The `Build APK` workflow now produces two artifacts: `Spinwise-apk` (install directly) and `Spinwise-play-bundle` (the `.aab` for Play).
2. Signing: the workflow signs with the key stored in the `KS_B64` and `KS_PASSWORD` secrets. Enrol in **Play App Signing** when you upload the first bundle. That key becomes your *upload key*, so keep a safe offline copy of `keystore/` (it is not in git).
3. Raise `versionCode` automatically: it already uses the GitHub run number.

## Before you submit
- [ ] Check Play's current **target API level** requirement. The app targets API 34. If Play requires a newer level, raise `targetSdk`/`compileSdk` in `app/build.gradle` and re-test the layout (newer levels enforce edge-to-edge).
- [ ] Host `privacy-policy.html` at a public URL (for example GitHub Pages) and fill in the date and support email.
- [ ] Complete the **Data safety** form (see `data-safety.md`) and the **content rating** questionnaire.
- [ ] Upload store assets: 512×512 icon, 1024×500 feature graphic, at least 2 phone screenshots.
- [ ] Paste the text from `listing.md`.
- [ ] Test on at least one real device: install, import, spin, widget, share, sync, uninstall.
- [ ] Upload the `.aab` to an **internal testing** track first, then closed test, then production.

## Known limits to mention in review notes
- No internet permission; all features work offline.
- The in-app Claude flow is copy-and-paste by the user; the app does not call any API.