# Releasing Spinwise on Google Play

## Accounts and one-off costs
1. Create a Google Play developer account (one-time registration fee). New personal accounts must run a **closed test** with a minimum number of testers for a set period before production access; check the current rules in Play Console.
2. Decide the package name. It is `com.spinwise.app` and cannot be changed after publishing.

## Build
1. Push to GitHub. The `Build APK` workflow now produces two artifacts: `Spinwise-apk` (the *sideload* build, installed directly, with in-app updates) and `Spinwise-play-bundle` (the *play* build `.aab`: no internet permission and no self-updater, as Play requires). Only upload the `.aab` to Play. See `UPDATES.md`.
2. Signing: the workflow signs with the key stored in the `KS_B64` and `KS_PASSWORD` secrets. Enrol in **Play App Signing** when you upload the first bundle. That key becomes your *upload key*, so keep a safe offline copy of `keystore/` (it is not in git).
3. Raise `versionCode` automatically: it already uses the GitHub run number.

## Before you submit
- [ ] Confirm Play's current **target API level** requirement. The app targets **API 35** (Android 15). If Play asks for a newer level, raise `targetSdk`/`compileSdk` in `app/build.gradle` (and the Android Gradle plugin in `build.gradle`).
- [ ] On an Android 15 or newer phone, check the top and bottom of the screen: the app pads itself clear of the status and navigation bars (insets listener in `MainActivity`).
- [ ] Host `privacy-policy.html` at a public URL (for example GitHub Pages) and fill in the date and support email.
- [ ] Complete the **Data safety** form (see `data-safety.md`) and the **content rating** questionnaire.
- [ ] Upload store assets from `store/assets/` (512×512 icon, 1024×500 feature graphic) and `store/screenshots/` (four 1080×1920 phone screenshots, demo data only). Replace the drawn artwork with your own designed versions if you like.
- [ ] Declarations: **Contains ads: No.** In-app purchases: none. App access: no login needed. Target audience: pick the age band that suits students.
- [ ] Paste the text from `listing.md`.
- [ ] Test on at least one real device: install, import, spin, widget, share, sync, uninstall.
- [ ] Upload the `.aab` to an **internal testing** track first, then closed test, then production.

## Known limits to mention in review notes
- No internet permission; all features work offline.
- The in-app Claude flow is copy-and-paste by the user; the app does not call any API.