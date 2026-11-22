package com.spinwise.app;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Sideload build only. Looks for a newer release in the public releases repo, downloads the APK,
 * checks its SHA-256 against the value published with the release, and hands it to Android's installer.
 * Android itself refuses the install unless the new APK is signed with the same key as the installed app.
 */
final class Updater {
    static final boolean ENABLED = true;

    private static final String REPO = "snipercreed/spinwise-releases";
    private static final String API = "https://api.github.com/repos/" + REPO + "/releases/latest";
    private static final String DOWNLOAD_PREFIX = "https://github.com/" + REPO + "/releases/download/";
    private static final String ACTION = "com.spinwise.app.INSTALL_STATUS";

    interface Sink { void js(String script); }

    private static boolean receiverRegistered = false;
    private static Sink lastSink = null;

    /** Looks up the latest release and tells the page whether it is newer than the installed version. */
    static void check(final Activity a, final Sink sink) {
        new Thread(new Runnable() { public void run() {
            String out;
            try { out = fetch(a); } catch (Exception e) { out = error(e.getClass().getSimpleName()); }
            sink.js("window.onUpdateInfo && window.onUpdateInfo(" + JSONObject.quote(out) + ")");
        }}).start();
    }

    private static String fetch(Activity a) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(API).openConnection();
        c.setConnectTimeout(8000);
        c.setReadTimeout(8000);
        c.setRequestProperty("Accept", "application/vnd.github+json");
        c.setRequestProperty("User-Agent", "Spinwise-Updater");
        int code = c.getResponseCode();
        if (code != 200) { c.disconnect(); return error(code == 404 ? "no releases yet" : "HTTP " + code); }
        String body = readAll(c.getInputStream());
        c.disconnect();

        JSONObject r = new JSONObject(body);
        String tag = r.optString("tag_name", "");
        Matcher m = Pattern.compile("(\\d+)$").matcher(tag);
        long remote = m.find() ? Long.parseLong(m.group(1)) : 0;
        long current = currentVersionCode(a);

        String notes = r.optString("body", "");
        Matcher sm = Pattern.compile("sha256:\\s*([0-9a-fA-F]{64})").matcher(notes);
        String sha = sm.find() ? sm.group(1).toLowerCase() : "";

        String url = "";
        long size = 0;
        JSONArray assets = r.optJSONArray("assets");
        if (assets != null) {
            for (int i = 0; i < assets.length(); i++) {
                JSONObject x = assets.getJSONObject(i);
                if (x.optString("name").endsWith(".apk")) { url = x.optString("browser_download_url"); size = x.optLong("size"); }
            }
        }
        boolean ok = remote > current && !sha.isEmpty() && url.startsWith(DOWNLOAD_PREFIX);

        JSONObject out = new JSONObject();
        out.put("available", ok);
        out.put("current", current);
        out.put("versionCode", remote);
        out.put("version", tag.startsWith("v") ? tag.substring(1) : tag);
        out.put("notes", notes.replaceAll("(?m)^sha256:.*$", "").trim());
        out.put("url", url);
        out.put("sha", sha);
        out.put("size", size);
        return out.toString();
    }

    /** Downloads the APK straight into an Android install session, verifying the checksum, then asks the system to install it. */
    static void install(final Activity a, final String url, final String sha, final long size, final Sink sink) {
        lastSink = sink;
        if (url == null || !url.startsWith(DOWNLOAD_PREFIX) || sha == null || sha.length() != 64) { status(sink, "error:invalid update"); return; }
        if (!a.getPackageManager().canRequestPackageInstalls()) {
            a.runOnUiThread(new Runnable() { public void run() {
                a.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + a.getPackageName())));
            }});
            status(sink, "needs-permission");
            return;
        }
        new Thread(new Runnable() { public void run() {
            PackageInstaller.Session session = null;
            try {
                status(sink, "downloading");
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setConnectTimeout(15000);
                c.setReadTimeout(30000);
                c.setRequestProperty("User-Agent", "Spinwise-Updater");
                if (c.getResponseCode() != 200) { status(sink, "error:download failed (HTTP " + c.getResponseCode() + ")"); return; }
                long total = c.getContentLengthLong() > 0 ? c.getContentLengthLong() : size;

                PackageInstaller pi = a.getPackageManager().getPackageInstaller();
                PackageInstaller.SessionParams sp = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                if (total > 0) sp.setSize(total);
                int id = pi.createSession(sp);
                session = pi.openSession(id);

                MessageDigest md = MessageDigest.getInstance("SHA-256");
                InputStream in = c.getInputStream();
                OutputStream out = session.openWrite("spinwise.apk", 0, total > 0 ? total : -1);
                byte[] buf = new byte[65536];
                long done = 0;
                int n, last = -1;
                while ((n = in.read(buf)) > 0) {
                    md.update(buf, 0, n);
                    out.write(buf, 0, n);
                    done += n;
                    int pct = total > 0 ? (int) (done * 100 / total) : 0;
                    if (pct != last) { last = pct; sink.js("window.onUpdateProgress && window.onUpdateProgress(" + pct + ")"); }
                }
                session.fsync(out);
                out.close();
                in.close();
                c.disconnect();

                StringBuilder hex = new StringBuilder();
                for (byte b : md.digest()) hex.append(String.format("%02x", b));
                if (!hex.toString().equalsIgnoreCase(sha)) {
                    session.abandon();
                    status(sink, "error:the download did not match its checksum");
                    return;
                }

                registerReceiver(a);
                Intent cb = new Intent(ACTION).setPackage(a.getPackageName());
                PendingIntent pend = PendingIntent.getBroadcast(a.getApplicationContext(), id, cb, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);
                status(sink, "installing");
                session.commit(pend.getIntentSender());
                session.close();
            } catch (Exception e) {
                try { if (session != null) session.abandon(); } catch (Exception ignored) {}
                status(sink, "error:" + e.getClass().getSimpleName());
            }
        }}).start();
    }

    private static synchronized void registerReceiver(final Activity a) {
        if (receiverRegistered) return;
        BroadcastReceiver r = new BroadcastReceiver() {
            @SuppressWarnings("deprecation")
            @Override public void onReceive(Context ctx, Intent i) {
                int st = i.getIntExtra(PackageInstaller.EXTRA_STATUS, -1);
                if (st == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                    Intent confirm = i.getParcelableExtra(Intent.EXTRA_INTENT);
                    if (confirm != null) { confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); ctx.startActivity(confirm); }
                } else if (st != PackageInstaller.STATUS_SUCCESS && lastSink != null) {
                    String msg = i.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
                    status(lastSink, "error:" + (msg == null ? "install failed" : msg));
                }
            }
        };
        IntentFilter f = new IntentFilter(ACTION);
        Context app = a.getApplicationContext();
        if (Build.VERSION.SDK_INT >= 33) app.registerReceiver(r, f, Context.RECEIVER_NOT_EXPORTED); else app.registerReceiver(r, f);
        receiverRegistered = true;
    }

    private static void status(Sink sink, String s) {
        sink.js("window.onUpdateStatus && window.onUpdateStatus(" + JSONObject.quote(s) + ")");
    }

    private static String error(String why) {
        try { return new JSONObject().put("available", false).put("error", why).toString(); } catch (Exception e) { return "{\"available\":false}"; }
    }

    @SuppressWarnings("deprecation")
    static long currentVersionCode(Activity a) throws Exception {
        PackageInfo p = a.getPackageManager().getPackageInfo(a.getPackageName(), 0);
        return Build.VERSION.SDK_INT >= 28 ? p.getLongVersionCode() : p.versionCode;
    }

    private static String readAll(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        in.close();
        return out.toString("UTF-8");
    }
}
