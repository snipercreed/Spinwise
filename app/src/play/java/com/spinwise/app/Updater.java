package com.spinwise.app;

import android.app.Activity;

/** Google Play build: no self-updater. Play delivers updates, and this build has no network permission. */
final class Updater {
    static final boolean ENABLED = false;

    interface Sink { void js(String script); }

    static void check(Activity a, Sink sink) {}

    static void install(Activity a, String url, String sha, long size, Sink sink) {}
}
