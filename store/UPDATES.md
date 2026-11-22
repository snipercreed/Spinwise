# In-app updates (sideload build)

The APK you install from GitHub can tell you when a newer build exists and install it for you. The **Google Play** build deliberately cannot: Play only allows updates through Play, and that build has no network permission.

| Build | Where it comes from | Updates |
|---|---|---|
| `sideload` | `Spinwise-apk` artifact | In-app: banner on Today, and More > App updates |
| `play` | `Spinwise-play-bundle` artifact (`.aab`) | Delivered by Google Play |

## How it works
1. Every push to `main` builds the APK, then publishes it as a release (`v1.0.<run number>`) in a **public** repo, `snipercreed/spinwise-releases`. Your source repo stays private.
2. The release notes are your commit message plus a `sha256:` line.
3. The app asks GitHub for the latest release (at most once every 12 hours on open, or when you tap *Check for updates*). If its number is higher than the installed version, you see an *Update available* banner.
4. Tapping **Update** downloads the APK straight into Android's installer, checks the SHA-256 matches the release, and asks Android to install it. Android only accepts it if it is signed with the same key as the installed app, so a tampered file cannot replace your app.
5. The first time, Android asks you to allow Spinwise to install apps. That is a one-off switch in system settings.

## One-time setup (about 5 minutes)
1. **Create the public repo.** On GitHub: *New repository* > name it exactly `spinwise-releases` > **Public** > tick *Add a README file* > Create. (It needs at least one commit so releases can be created.)
2. **Create an access token.** GitHub > Settings > Developer settings > Personal access tokens > *Fine-grained tokens* > Generate new token.
   - Repository access: *Only select repositories* > `spinwise-releases`
   - Permissions > Repository permissions > **Contents: Read and write**
   - Copy the token.
3. **Add it as a secret** in the **Spinwise** repo (the private one): Settings > Secrets and variables > Actions > *New repository secret* > name `RELEASES_TOKEN`, value = the token.
4. Push a change. The workflow's *Publish update for in-app updates* step creates the first release.

Until the secret exists the step is skipped and everything else builds as normal.

## First install
Builds made before this feature cannot update themselves, so install **one** new APK by hand from the Actions page. From then on, updates arrive in the app. Keep using the same signing key (the `KS_B64` and `KS_PASSWORD` secrets), or Android will refuse the update.

## Changing the repo name
The repo is set in two places: `REPO` in `app/src/sideload/java/com/spinwise/app/Updater.java`, and `--repo` in `.github/workflows/build.yml`.
