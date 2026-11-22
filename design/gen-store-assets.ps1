# Draws the Play Store icon (512x512) and a feature graphic (1024x500) in the default Forest colours.
Add-Type -AssemblyName System.Drawing
$out = Join-Path (Split-Path $PSScriptRoot) "store\assets"; New-Item -ItemType Directory -Force $out | Out-Null
function C($h,$a=255){ [System.Drawing.Color]::FromArgb($a,[Convert]::ToInt32($h.Substring(1,2),16),[Convert]::ToInt32($h.Substring(3,2),16),[Convert]::ToInt32($h.Substring(5,2),16)) }
function DrawLogo($g,$cx,$cy,$r,$tint,$hub){
  $white = New-Object Drawing.SolidBrush (C "#ffffff"); $tb = New-Object Drawing.SolidBrush (C $tint); $hb = New-Object Drawing.SolidBrush (C $hub)
  $rect = New-Object Drawing.RectangleF ($cx-$r),($cy-$r),(2*$r),(2*$r)
  $g.FillPie($white,$rect.X,$rect.Y,$rect.Width,$rect.Height,270,90); $g.FillPie($tb,$rect.X,$rect.Y,$rect.Width,$rect.Height,0,90)
  $g.FillPie($white,$rect.X,$rect.Y,$rect.Width,$rect.Height,90,90);  $g.FillPie($tb,$rect.X,$rect.Y,$rect.Width,$rect.Height,180,90)
  $g.FillEllipse($hb,$cx-$r*.23,$cy-$r*.23,$r*.46,$r*.46)
  $pts=@((New-Object Drawing.PointF $cx,($cy-$r*1.4)),(New-Object Drawing.PointF ($cx-$r*.25),($cy-$r*.93)),(New-Object Drawing.PointF ($cx+$r*.25),($cy-$r*.93)))
  $g.FillPolygon($white,$pts)
}
# icon
$bmp = New-Object Drawing.Bitmap 512,512; $g = [Drawing.Graphics]::FromImage($bmp); $g.SmoothingMode='AntiAlias'
$br = New-Object Drawing.Drawing2D.LinearGradientBrush (New-Object Drawing.Point 0,0),(New-Object Drawing.Point 512,512),(C "#2fae65"),(C "#0f6b3a"); $g.FillRectangle($br,0,0,512,512)
DrawLogo $g 256 285 140 "#bde5cb" "#0f6b3a"; $bmp.Save("$out\icon-512.png",[Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $bmp.Dispose()
# feature graphic
$bmp = New-Object Drawing.Bitmap 1024,500; $g = [Drawing.Graphics]::FromImage($bmp); $g.SmoothingMode='AntiAlias'; $g.TextRenderingHint='AntiAliasGridFit'
$br = New-Object Drawing.Drawing2D.LinearGradientBrush (New-Object Drawing.Point 0,0),(New-Object Drawing.Point 1024,500),(C "#1fa56a"),(C "#2a6fd6"); $g.FillRectangle($br,0,0,1024,500)
foreach($b in @(@(820,60,360,"#ffffff",40),@(120,430,300,"#bde5cb",60),@(520,-60,260,"#ffd9a8",45))){ $sb=New-Object Drawing.SolidBrush (C $b[3] $b[4]); $g.FillEllipse($sb,$b[0]-$b[2]/2,$b[1]-$b[2]/2,$b[2],$b[2]) }
$ic = New-Object Drawing.Bitmap "$out\icon-512.png"; $path = New-Object Drawing.Drawing2D.GraphicsPath; $rr=62; $x0=70;$y0=100;$s=300
$path.AddArc($x0,$y0,$rr,$rr,180,90); $path.AddArc($x0+$s-$rr,$y0,$rr,$rr,270,90); $path.AddArc($x0+$s-$rr,$y0+$s-$rr,$rr,$rr,0,90); $path.AddArc($x0,$y0+$s-$rr,$rr,$rr,90,90); $path.CloseFigure()
$g.SetClip($path); $g.DrawImage($ic,$x0,$y0,$s,$s); $g.ResetClip()
$f1 = New-Object Drawing.Font "Segoe UI Semibold",84,([Drawing.FontStyle]::Regular),([Drawing.GraphicsUnit]::Pixel); $f2 = New-Object Drawing.Font "Segoe UI",34,([Drawing.FontStyle]::Regular),([Drawing.GraphicsUnit]::Pixel)
$wb = New-Object Drawing.SolidBrush (C "#ffffff"); $g.DrawString("Spinwise",$f1,$wb,410,150); $g.DrawString("Spin a topic. Revise it.",$f2,$wb,416,265); $g.DrawString("Keep the streak.",$f2,$wb,416,311)
$bmp.Save("$out\feature-graphic-1024x500.png",[Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $bmp.Dispose(); $ic.Dispose()
Get-ChildItem $out | Select Name,Length
