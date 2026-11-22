# Security notes

Spinwise is a local-first app with no server and no network permission. The main risks are therefore untrusted *content* (pasted, shared or synced text) and the WebView that displays it.

## What is in place
| Area | Measure |
|---|---|
| Network | No `INTERNET` permission. Cleartext traffic disabled by a network security config. The WebView also blocks every request that is not a bundled asset. |
| WebView | File, content and universal file-URL access off. Mixed content blocked. Navigation away from the app page is refused. New windows are not allowed. |
| Bridge | The `Android` JavaScript interface exposes only the listed `@JavascriptInterface` methods, and is only reachable from the bundled page. |
| Injected content | Every imported, shared or synced string is HTML-escaped before it is drawn. A test injects script and attribute payloads through the importer, share code and sync file and confirms nothing executes. |
| Imported data | Backups and sync files are rebuilt through a strict sanitiser: allowed keys only, types and lengths clamped, `__proto__`/`constructor` tricks rejected, caps on counts. |
| Size limits | Pasted text over 2 MB, shared text over 2 MB and sync files over 6 MB are refused. |
| Share intake | Only plain text is accepted, and it is passed to the page as an escaped JSON string. |
| Exported components | Only the launcher (activity and its icon aliases) and the widget receiver are exported. |
| Signing | The release key is not in git. CI reads it from repository secrets. |
| User control | More > About > Delete all my data erases local data, the saved copy, widget data and the sync link. |

## Known and accepted
- The WebView page is loaded from `file:///android_asset`, which keeps your existing data. A stricter `https://` asset origin would change where data is stored and is not used.
- Sync trusts whoever can write to the sync file in your cloud storage. Treat that file like your data.
- No certificate pinning is needed because the app makes no network requests.
