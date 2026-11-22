package com.spinwise.app;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView web;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setTextZoom(100);
        web.setBackgroundColor(getResources().getColor(R.color.bg, getTheme()));
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Bridge(), "Android");
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    @Override protected void onResume() {
        super.onResume();
        StreakWidget.refresh(this);
    }

    @Override public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    private class Bridge {
        @JavascriptInterface public void sync(String json) {
            getSharedPreferences(StreakWidget.PREFS, MODE_PRIVATE).edit().putString(StreakWidget.KEY, json).apply();
            StreakWidget.refresh(getApplicationContext());
        }
        @JavascriptInterface public void setMode(final boolean dark) {
            runOnUiThread(new Runnable() { public void run() {
                int bg = dark ? 0xFF0D1012 : 0xFFF4F6F3;
                web.setBackgroundColor(bg);
                Window w = getWindow();
                w.setStatusBarColor(bg);
                w.setNavigationBarColor(bg);
                int f = dark ? 0 : (View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
                w.getDecorView().setSystemUiVisibility(f);
            }});
        }        @JavascriptInterface public void copy(final String text) {
            runOnUiThread(new Runnable() { public void run() {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                cm.setPrimaryClip(ClipData.newPlainText("Spinwise", text));
            }});
        }
    }
}