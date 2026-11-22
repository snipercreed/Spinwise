$r = Split-Path $PSScriptRoot
$f = "$r\app\src\main\assets\fonts"
function B64($n){ "data:font/woff2;base64," + [Convert]::ToBase64String([IO.File]::ReadAllBytes("$f\$n")) }
$t = [IO.File]::ReadAllText("$PSScriptRoot\lookbook.template.html")
$t = $t.Replace("__JAKARTA__",(B64 "PlusJakartaSans-Regular.woff2")).Replace("__CLASH__",(B64 "ClashDisplay-Semibold.woff2")).Replace("__CHILLAX__",(B64 "Chillax-Semibold.woff2"))
$t = $t.Replace("__MOTION_CSS__",[IO.File]::ReadAllText("$r\app\src\main\assets\motion.css")).Replace("__MOTION_JS__",[IO.File]::ReadAllText("$r\app\src\main\assets\motion.js"))
[IO.File]::WriteAllText("$PSScriptRoot\motion-lookbook.html",$t,(New-Object Text.UTF8Encoding $false))
"built {0:N0} KB" -f ((Get-Item "$PSScriptRoot\motion-lookbook.html").Length/1KB)
$c = [IO.File]::ReadAllText("$PSScriptRoot\concept.template.html")
$c = $c.Replace("__JAKARTA__",(B64 "PlusJakartaSans-Regular.woff2")).Replace("__CLASH__",(B64 "ClashDisplay-Semibold.woff2")).Replace("__CHILLAX__",(B64 "Chillax-Semibold.woff2"))
[IO.File]::WriteAllText("$PSScriptRoot\liquid-glass-concept.html",$c,(New-Object Text.UTF8Encoding $false))
"built concept {0:N0} KB" -f ((Get-Item "$PSScriptRoot\liquid-glass-concept.html").Length/1KB)
