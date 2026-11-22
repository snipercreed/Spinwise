# Generates one launcher icon variant per accent colour / glass theme (adaptive icon + manifest alias + key list).
# Run from anywhere:  powershell -File design\gen-icons.ps1
$r = Split-Path $PSScriptRoot
$res = "$r\app\src\main\res"
function W($p,$c){ New-Item -ItemType Directory -Force (Split-Path $p) | Out-Null; [IO.File]::WriteAllText($p,$c,(New-Object Text.UTF8Encoding $false)) }
function Mix($a,$b,$t){ $A=1,3,5 | % { [Convert]::ToInt32($a.Substring($_,2),16) }; $B=1,3,5 | % { [Convert]::ToInt32($b.Substring($_,2),16) }
  "#" + ((0..2 | % { '{0:X2}' -f [int][Math]::Round($A[$_]*$t + $B[$_]*(1-$t)) }) -join "") }

$V = [ordered]@{
  a_forest=@("#1f8a4c","#0f6b3a"); a_ocean=@("#1d6fd1","#114b9a"); a_violet=@("#7a48d8","#53289f"); a_sunset=@("#e0662a","#b0431a"); a_rose=@("#d6336c","#a31d4c"); a_slate=@("#3f4a54","#1d252c");
  t_aurora=@("#1fa56a","#2a6fd6"); t_dusk=@("#e8613a","#8a3fd0"); t_ocean=@("#1d6fd1","#0a3a8a"); t_sakura=@("#e0457b","#a05acd"); t_mint=@("#14a37f","#3a8fd6"); t_glacier=@("#3b8fe0","#7a6ae0");
  t_nebula=@("#7a48d8","#d040a0"); t_ember=@("#e0451f","#f0a020"); t_lagoon=@("#0fb5a5","#2a8fd0"); t_obsidian=@("#2a2f38","#8a6a2a"); t_golden=@("#f0a020","#e0603a"); t_cosmic=@("#5b4bdb","#e0409a")
}
Get-ChildItem "$res\drawable\ic_bg_*.xml","$res\drawable\ic_fg_*.xml","$res\mipmap-anydpi-v26\ic_*.xml" -ErrorAction SilentlyContinue | Remove-Item -Force
$aliases = ""
foreach ($k in $V.Keys) {
  $h0=$V[$k][0]; $h1=$V[$k][1]; $start=Mix $h0 "#ffffff" 0.85; $tint=Mix $h0 "#ffffff" 0.30
  W "$res\drawable\ic_bg_$k.xml" "<?xml version=`"1.0`" encoding=`"utf-8`"?>`n<shape xmlns:android=`"http://schemas.android.com/apk/res/android`" android:shape=`"rectangle`">`n    <gradient android:type=`"linear`" android:angle=`"315`" android:startColor=`"$start`" android:endColor=`"$h1`"/>`n</shape>`n"
  W "$res\drawable\ic_fg_$k.xml" @"
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">
    <path android:fillColor="#FFFFFF" android:pathData="M54,56L54,28A28,28 0 0 1 82,56Z"/>
    <path android:fillColor="$tint" android:pathData="M54,56L82,56A28,28 0 0 1 54,84Z"/>
    <path android:fillColor="#FFFFFF" android:pathData="M54,56L54,84A28,28 0 0 1 26,56Z"/>
    <path android:fillColor="$tint" android:pathData="M54,56L26,56A28,28 0 0 1 54,28Z"/>
    <path android:fillColor="$h1" android:pathData="M54,56m-6.5,0a6.5,6.5 0 1 1,13 0a6.5,6.5 0 1 1,-13 0"/>
    <path android:fillColor="#FFFFFF" android:pathData="M54,20L47.5,31L60.5,31Z"/>
</vector>
"@
  W "$res\mipmap-anydpi-v26\ic_$k.xml" "<?xml version=`"1.0`" encoding=`"utf-8`"?>`n<adaptive-icon xmlns:android=`"http://schemas.android.com/apk/res/android`">`n    <background android:drawable=`"@drawable/ic_bg_$k`"/>`n    <foreground android:drawable=`"@drawable/ic_fg_$k`"/>`n    <monochrome android:drawable=`"@drawable/ic_mono`"/>`n</adaptive-icon>`n"
  $en = if ($k -eq "a_forest") { "true" } else { "false" }
  $aliases += @"
        <activity-alias android:name=".Icon_$k" android:targetActivity=".MainActivity" android:enabled="$en" android:exported="true" android:icon="@mipmap/ic_$k" android:roundIcon="@mipmap/ic_$k" android:label="Spinwise">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity-alias>

"@
}
Remove-Item "$res\drawable\ic_fg.xml","$res\mipmap-anydpi-v26\ic_launcher.xml" -Force -ErrorAction SilentlyContinue
W "$r\app\src\main\AndroidManifest.xml" @"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:label="Spinwise"
        android:icon="@mipmap/ic_a_forest"
        android:roundIcon="@mipmap/ic_a_forest"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:networkSecurityConfig="@xml/network_security_config"
        android:theme="@style/AppTheme">
        <activity android:name=".MainActivity" android:exported="true" android:launchMode="singleTop"
            android:configChanges="orientation|screenSize|keyboardHidden|uiMode"
            android:windowSoftInputMode="adjustResize">
            <!-- receive a checklist shared from another app -->
            <intent-filter>
                <action android:name="android.intent.action.SEND"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <data android:mimeType="text/plain"/>
            </intent-filter>
        </activity>
$aliases        <receiver android:name=".StreakWidget" android:exported="true">
            <intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE"/></intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/streak_widget_info"/>
        </receiver>
    </application>
</manifest>
"@
$keys = ($V.Keys | % { '"' + $_ + '"' }) -join ", "
W "$r\app\src\main\java\com\spinwise\app\IconKeys.java" "package com.spinwise.app;`n`nfinal class IconKeys {`n    static final String[] ALL = { $keys };`n}`n"
"generated $($V.Count) icon variants"
