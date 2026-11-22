package com.spinwise.app;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

public class MainActivity extends Activity {
    private static final int REQ_SYNC_CREATE = 41;
    private static final int REQ_SYNC_JOIN = 42;
    private static final int MAX_SHARE_CHARS = 2000000;
    private WebView web;
    private FrameLayout root;
    private boolean pageLoaded = false;
    private String pendingShare = null;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);          // the app itself is JavaScript
        s.setDomStorageEnabled(true);
        s.setTextZoom(100);
        // Hardening: the app only ever shows its own bundled page. Nothing else may be loaded.
        s.setAllowFileAccess(false);           // bundled assets (file:///android_asset) still load
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setAllowContentAccess(false);
        s.setGeolocationEnabled(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setSupportMultipleWindows(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        int bg = getResources().getColor(R.color.bg, getTheme());
        web.setBackgroundColor(bg);
        web.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                pageLoaded = true;
                if (pendingShare != null) { deliverShare(pendingShare); pendingShare = null; }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return true;                   // never navigate away from the app
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String u = request.getUrl().toString();
                if (u.startsWith("file:///android_asset/") || u.startsWith("data:") || u.startsWith("blob:")) return null;
                return new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));   // block everything else
            }
        });
        web.addJavascriptInterface(new Bridge(), "Android");
        // Android 15 draws apps edge to edge, so keep the page clear of the status and navigation bars
        root = new FrameLayout(this);
        root.setBackgroundColor(bg);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
                return insets.consumeSystemWindowInsets();
            }
        });
        setContentView(root);
        web.loadUrl("file:///android_asset/index.html");
        handleIntent(getIntent());
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    /** Text shared to Spinwise from another app (a friend's checklist). */
    private void handleIntent(Intent i) {
        if (i == null || !Intent.ACTION_SEND.equals(i.getAction())) return;
        String t = i.getStringExtra(Intent.EXTRA_TEXT);
        if (t == null || t.length() > MAX_SHARE_CHARS) return;    // ignore missing or oversized shares
        if (pageLoaded) deliverShare(t); else pendingShare = t;
    }

    private void deliverShare(String text) {
        web.evaluateJavascript("window.onSharedText && window.onSharedText(" + JSONObject.quote(text) + ")", null);
    }

    @Override protected void onResume() {
        super.onResume();
        StreakWidget.refresh(this);
        if (pageLoaded) web.evaluateJavascript("window.onAppResume && window.onAppResume()", null);
    }

    @Override public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    @Override protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if ((req == REQ_SYNC_CREATE || req == REQ_SYNC_JOIN) && res == RESULT_OK && data != null && data.getData() != null) {
            Uri uri = data.getData();
            try {
                getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            } catch (Exception ignored) {}
            String name = displayName(uri);
            prefs().edit().putString("syncUri", uri.toString()).putString("syncName", name).apply();
            web.evaluateJavascript("window.onSyncLinked && window.onSyncLinked(" + (req == REQ_SYNC_CREATE) + "," + JSONObject.quote(name) + ")", null);
        }
    }

    private SharedPreferences prefs() {
        return getSharedPreferences(StreakWidget.PREFS, MODE_PRIVATE);
    }

    private String displayName(Uri uri) {
        String n = "";
        Cursor c = null;
        try {
            c = getContentResolver().query(uri, null, null, null, null);
            if (c != null && c.moveToFirst()) {
                int i = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (i >= 0) n = c.getString(i);
            }
        } catch (Exception ignored) {
        } finally {
            if (c != null) c.close();
        }
        return (n == null || n.isEmpty()) ? "sync file" : n;
    }

    private class Bridge {
        @JavascriptInterface public void sync(String json) {
            prefs().edit().putString(StreakWidget.KEY, json).apply();
            StreakWidget.refresh(getApplicationContext());
        }

        @JavascriptInterface public void setMode(final boolean dark) {
            runOnUiThread(new Runnable() { public void run() {
                int bg = dark ? 0xFF0D1012 : 0xFFF4F6F3;
                web.setBackgroundColor(bg);
                if (root != null) root.setBackgroundColor(bg);
                Window w = getWindow();
                w.setStatusBarColor(bg);
                w.setNavigationBarColor(bg);
                int f = dark ? 0 : (View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
                w.getDecorView().setSystemUiVisibility(f);
            }});
        }

        @JavascriptInterface public void haptic() {
            runOnUiThread(new Runnable() { public void run() {
                web.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP);
            }});
        }

        @JavascriptInterface public void saveState(String json) {
            prefs().edit().putString("state", json).apply();
        }

        @JavascriptInterface public String loadState() {
            return prefs().getString("state", "");
        }

        @JavascriptInterface public void setIcon(final String key) {
            runOnUiThread(new Runnable() { public void run() {
                boolean known = false;
                for (String k : IconKeys.ALL) if (k.equals(key)) known = true;
                if (!known) return;
                PackageManager pm = getPackageManager();
                String pkg = getPackageName();
                pm.setComponentEnabledSetting(new ComponentName(pkg, "com.spinwise.app.Icon_" + key), PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
                for (String k : IconKeys.ALL) {
                    if (!k.equals(key)) pm.setComponentEnabledSetting(new ComponentName(pkg, "com.spinwise.app.Icon_" + k), PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
                }
            }});
        }

        @JavascriptInterface public void copy(final String text) {
            runOnUiThread(new Runnable() { public void run() {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                cm.setPrimaryClip(ClipData.newPlainText("Spinwise", text));
            }});
        }

        /** Opens the Android share sheet with plain text. */
        @JavascriptInterface public void share(final String text) {
            runOnUiThread(new Runnable() { public void run() {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(i, "Share"));
            }});
        }

        /** Lets the user pick (or create) a file in any cloud storage app to hold the synced data. */
        @JavascriptInterface public void pickSyncFile(final boolean create) {
            runOnUiThread(new Runnable() { public void run() {
                Intent i;
                if (create) {
                    i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    i.setType("application/json");
                    i.putExtra(Intent.EXTRA_TITLE, "spinwise-sync.json");
                } else {
                    i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    i.setType("*/*");
                }
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                startActivityForResult(i, create ? REQ_SYNC_CREATE : REQ_SYNC_JOIN);
            }});
        }

        @JavascriptInterface public String syncRead() {
            String u = prefs().getString("syncUri", "");
            if (u.isEmpty()) return "";
            try {
                InputStream in = getContentResolver().openInputStream(Uri.parse(u));
                if (in == null) return "";
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buf = new byte[8192];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                in.close();
                return out.toString("UTF-8");
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface public void syncWrite(final String json) {
            final String u = prefs().getString("syncUri", "");
            if (u.isEmpty()) return;
            new Thread(new Runnable() { public void run() {
                try {
                    OutputStream o = getContentResolver().openOutputStream(Uri.parse(u), "wt");
                    if (o == null) return;
                    o.write(json.getBytes("UTF-8"));
                    o.close();
                } catch (Exception ignored) {}
            }}).start();
        }

        @JavascriptInterface public void syncUnlink() {
            prefs().edit().remove("syncUri").remove("syncName").apply();
        }

        /** Erases everything the app has stored natively (saved copy, widget data, sync link). */
        @JavascriptInterface public void wipe() {
            prefs().edit().clear().apply();
            StreakWidget.refresh(getApplicationContext());
        }
    }
}
