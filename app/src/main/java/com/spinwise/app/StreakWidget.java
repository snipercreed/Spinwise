package com.spinwise.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.widget.RemoteViews;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class StreakWidget extends AppWidgetProvider {
    static final String PREFS = "spinwise";
    static final String KEY = "summary";
    static final int[] LEVELS = {R.drawable.sq_l0, R.drawable.sq_l1, R.drawable.sq_l2, R.drawable.sq_l3, R.drawable.sq_l4};

    @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) m.updateAppWidget(id, build(c));
    }

    public static void refresh(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, StreakWidget.class));
        for (int id : ids) m.updateAppWidget(id, build(c));
    }

    static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget);

        int pct = 0, goal = 1, total = 0;
        String pickTitle = null, subject = "Spinwise";
        boolean logged = false;
        JSONObject days = new JSONObject();
        try {
            String raw = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null);
            if (raw != null) {
                JSONObject j = new JSONObject(raw);
                pct = j.optInt("pct", 0);
                goal = Math.max(1, j.optInt("goal", 1));
                total = j.optInt("total", 0);
                days = j.optJSONObject("days") != null ? j.optJSONObject("days") : new JSONObject();
                String s = j.optString("subject", "");
                if (!s.isEmpty()) subject = s;
                JSONObject p = j.optJSONObject("pick");
                SimpleDateFormat f0 = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                if (p != null && f0.format(Calendar.getInstance().getTime()).equals(p.optString("date"))) {
                    pickTitle = p.optString("title");
                    logged = p.optBoolean("logged", false);
                }
            }
        } catch (Exception ignored) {}

        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        Calendar cal = Calendar.getInstance();
        int todayCount = days.optInt(f.format(cal.getTime()), 0);

        // streak: consecutive days with revisions, allowing today to be empty so far
        int streak = 0;
        Calendar sc = Calendar.getInstance();
        if (days.optInt(f.format(sc.getTime()), 0) == 0) sc.add(Calendar.DAY_OF_YEAR, -1);
        while (days.optInt(f.format(sc.getTime()), 0) > 0) { streak++; sc.add(Calendar.DAY_OF_YEAR, -1); }

        // last 14 days, oldest first
        for (int i = 0; i < 14; i++) {
            Calendar d = Calendar.getInstance();
            d.add(Calendar.DAY_OF_YEAR, -(13 - i));
            int n = days.optInt(f.format(d.getTime()), 0);
            int lvl = n == 0 ? 0 : n == 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4;
            int id = c.getResources().getIdentifier("sq" + i, "id", c.getPackageName());
            v.setImageViewResource(id, LEVELS[lvl]);
        }

        v.setTextViewText(R.id.w_subject, subject);
        v.setTextViewText(R.id.w_streak, String.valueOf(streak));
        v.setTextViewText(R.id.w_streak_lbl, streak == 1 ? "day streak" : "day streak");
        v.setTextViewText(R.id.w_pct, pct + "%");
        v.setProgressBar(R.id.w_bar, 100, pct, false);
        String line;
        if (total == 0) line = "Open Spinwise to set up";
        else if (pickTitle != null && !logged) line = "Today: " + pickTitle;
        else if (todayCount >= goal) line = "Goal done: " + todayCount + "/" + goal + " today";
        else line = "Spin today's topic  \u2022  " + todayCount + "/" + goal;
        v.setTextViewText(R.id.w_line, line);

        Intent open = new Intent(c, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.w_root, pi);
        return v;
    }
}