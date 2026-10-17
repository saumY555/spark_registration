Add-Type -AssemblyName System.Drawing

$canvasW = 1080
$canvasH = 1920
$bmp = New-Object System.Drawing.Bitmap($canvasW, $canvasH)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# 1. Canvas Background: #140A3A
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 20, 10, 58))
$g.FillRectangle($bgBrush, 0, 0, $canvasW, $canvasH)

# 2. Background letters
# Huge Anton letters, uppercase, font-size ~395px (cap height = 340px), letter-spacing: -10px
# Load font
$fontAnton = New-Object System.Drawing.Font("Impact", 310, [System.Drawing.FontStyle]::Bold) # approx cap height 340px

$rows = @(
  @{
    Text = "SEARCH"; Y = 10; X = -20;
    Colors = @("#6238F5", "#2C1478", "#6238F5", "#E8307A", "#2C1478", "#6238F5")
  },
  @{
    Text = "FORSPARK"; Y = 395; X = -140;
    Colors = @("#2C1478", "#6238F5", "#2C1478", "#E8307A", "#6238F5", "#2C1478", "#6238F5", "#2C1478")
  },
  @{
    Text = "SEARCH"; Y = 780; X = -60;
    Colors = @("#6238F5", "#2C1478", "#E8307A", "#6238F5", "#2C1478", "#6238F5")
  },
  @{
    Text = "FORSPARK"; Y = 1165; X = -190;
    Colors = @("#6238F5", "#2C1478", "#6238F5", "#2C1478", "#6238F5", "#E8307A", "#2C1478", "#6238F5")
  },
  @{
    Text = "SPARKFOR"; Y = 1550; X = -40;
    Colors = @("#6238F5", "#2C1478", "#E8307A", "#6238F5", "#C5E800", "#2C1478", "#6238F5", "#2C1478")
  }
)

foreach ($row in $rows) {
  $curX = $row.X
  for ($i = 0; $i -lt $row.Text.Length; $i++) {
    $char = $row.Text.Substring($i, 1)
    $hex = $row.Colors[$i]
    $c = [System.Drawing.ColorTranslator]::FromHtml($hex)
    $b = New-Object System.Drawing.SolidBrush($c)
    $g.DrawString($char, $fontAnton, $b, $curX, $row.Y)
    $charSize = $g.MeasureString($char, $fontAnton)
    $curX += ($charSize.Width - 52) # tight letter advance
  }
}

# Soft vignette overlay: radial-gradient edges darkened toward #08031C (35% strength)
# In GDI+, draw subtle edge shading
$vigBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 8, 3, 28))
$g.FillRectangle($vigBrush, 0, 0, $canvasW, 120)
$g.FillRectangle($vigBrush, 0, $canvasH - 120, $canvasW, 120)

# 4. Peeking pink cards (drawn after background letters and before main card)
$logoPath = Resolve-Path "public/spark_logo_transparent.png"
$logoBmp = [System.Drawing.Bitmap]::FromFile($logoPath)

# Top-right card: center at (1050, 330), rotated 4 degrees counter-clockwise (-4deg)
$g.TranslateTransform(1050, 330)
$g.RotateTransform(-4.0)
$cardShadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 0, 0, 0))
$g.FillRectangle($cardShadow, -135, -188, 280, 390)
$g.FillRectangle([System.Drawing.Brushes]::White, -140, -195, 280, 390)

# Pink rectangle: inset left 14%, top 14%, right 8%, bottom 20%
$pinkX = -140 + (280 * 0.14)
$pinkY = -195 + (390 * 0.14)
$pinkW = 280 * (1.0 - 0.14 - 0.08)
$pinkH = 390 * (1.0 - 0.14 - 0.20)
$pinkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#E8307A"))
$g.FillRectangle($pinkBrush, $pinkX, $pinkY, $pinkW, $pinkH)

# Clip to pink rect for logo
$clipSave = $g.Clip
$g.SetClip((New-Object System.Drawing.RectangleF($pinkX, $pinkY, $pinkW, $pinkH)))
$logoW1 = 250
$logoH1 = [int]($logoW1 * ($logoBmp.Height / $logoBmp.Width))
$g.DrawImage($logoBmp, -140 + (280 * 0.14), -195 + (390 * 0.30), $logoW1, $logoH1)
$g.Clip = $clipSave
$g.ResetTransform()

# Bottom-left card: center at (10, 1500), rotated 5 degrees counter-clockwise (-5deg)
$g.TranslateTransform(10, 1500)
$g.RotateTransform(-5.0)
$g.FillRectangle($cardShadow, -135, -188, 280, 390)
$g.FillRectangle([System.Drawing.Brushes]::White, -140, -195, 280, 390)
$pinkX2 = -140 + (280 * 0.14)
$pinkY2 = -195 + (390 * 0.14)
$pinkW2 = 280 * (1.0 - 0.14 - 0.08)
$pinkH2 = 390 * (1.0 - 0.14 - 0.20)
$g.FillRectangle($pinkBrush, $pinkX2, $pinkY2, $pinkW2, $pinkH2)

$g.SetClip((New-Object System.Drawing.RectangleF($pinkX2, $pinkY2, $pinkW2, $pinkH2)))
$logoW2 = 175
$logoH2 = [int]($logoW2 * ($logoBmp.Height / $logoBmp.Width))
$g.DrawImage($logoBmp, -140 + (280 * 0.22), -195 + (390 * 0.27), $logoW2, $logoH2)
$g.Clip = $clipSave
$g.ResetTransform()

# 3. Main white card: Size 780x1260, white, centered at (540, 960), rotated -3.5 deg
$cardW = 780.0
$cardH = 1260.0
$g.TranslateTransform(540, 960)
$g.RotateTransform(-3.5)

# Shadow: 16px 26px 60px rgba(0,0,0,0.55)
$mainShadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(140, 0, 0, 0))
$g.FillRectangle($mainShadow, (-$cardW / 2) + 16, (-$cardH / 2) + 26, $cardW, $cardH)
$g.FillRectangle([System.Drawing.Brushes]::White, -$cardW / 2, -$cardH / 2, $cardW, $cardH)

# Coordinates inside card: top-left is (-$cardW/2, -$cardH/2)
$cardLeft = -$cardW / 2
$cardTop = -$cardH / 2

# 3a. Photo frame: left 30, top 30, width 720, height 870
$frameX = $cardLeft + 30
$frameY = $cardTop + 30
$frameW = 720
$frameH = 870

# Gradient fallback: vertical #6238F5 to #9E2EB9
$gradP1 = New-Object System.Drawing.PointF([float]$frameX, [float]$frameY)
$gradP2 = New-Object System.Drawing.PointF([float]$frameX, [float]($frameY + $frameH))
$gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $gradP1,
  $gradP2,
  [System.Drawing.ColorTranslator]::FromHtml("#6238F5"),
  [System.Drawing.ColorTranslator]::FromHtml("#9E2EB9")
)
$g.FillRectangle($gradBrush, $frameX, $frameY, $frameW, $frameH)

# Dashed stitch line guide inside placeholder
$dashPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 255, 255, 255), 2.5)
$dashPen.DashPattern = @(4.0, 3.0)
$g.DrawRectangle($dashPen, $frameX + 16, $frameY + 16, $frameW - 32, $frameH - 32)

# 3b. Lime name tag: x=200 to 580 (width 380), y=870 to 936 (height 66), background #C5E800
$tagX = $cardLeft + 200
$tagY = $cardTop + 870
$tagW = 380
$tagH = 66
$limeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#C5E800"))
$g.FillRectangle($limeBrush, $tagX, $tagY, $tagW, $tagH)

$fontTag = New-Object System.Drawing.Font("Impact", 32, [System.Drawing.FontStyle]::Bold)
$darkTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#0E0A18"))
$sfCenter = New-Object System.Drawing.StringFormat
$sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
$sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Center
$g.DrawString("HEY, I AM DFB", $fontTag, $darkTextBrush, $tagX + ($tagW / 2), $tagY + ($tagH / 2) + 2, $sfCenter)

# 3c. Title
# Line 1: "EXCITED TO SHARE" Anton 70px, color #0E0A18, left x=38, baseline y=1028
$fontTitle = New-Object System.Drawing.Font("Impact", 56, [System.Drawing.FontStyle]::Bold)
$titleY1 = $cardTop + 960 # baseline ~1028
$g.DrawString("EXCITED TO SHARE", $fontTitle, $darkTextBrush, $cardLeft + 38, $titleY1)

# Line 2: "MY FIRST " in #0E0A18 followed by "WEBSITE!" in #6238F5, left x=38, baseline y=1105
$titleY2 = $cardTop + 1038 # baseline ~1105
$g.DrawString("MY FIRST ", $fontTitle, $darkTextBrush, $cardLeft + 38, $titleY2)
$firstSize = $g.MeasureString("MY FIRST ", $fontTitle)
$purpleTitleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#6238F5"))
$g.DrawString("WEBSITE!", $fontTitle, $purpleTitleBrush, $cardLeft + 38 + $firstSize.Width - 16, $titleY2)

# 3d. Bottom bars
# Left bar: x=30 to 450 (width 420), y=1160 to 1216 (height 56), background #0E0A18. Text "SPARK CLUB", white, bold sans 24px
$barY = $cardTop + 1160
$barH = 56
$g.FillRectangle($darkTextBrush, $cardLeft + 30, $barY, 420, $barH)

$fontBar = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Bold)
$g.DrawString("SPARK CLUB", $fontBar, [System.Drawing.Brushes]::White, $cardLeft + 30 + 210, $barY + 28, $sfCenter)

# Right box: x=480 to 750 (width 270), same y range, 4px solid #0E0A18 border, white fill. Text "26-27 TEAM"
$g.FillRectangle([System.Drawing.Brushes]::White, $cardLeft + 480, $barY, 270, $barH)
$borderPen = New-Object System.Drawing.Pen($darkTextBrush, 4.0)
$g.DrawRectangle($borderPen, $cardLeft + 480, $barY, 270, $barH)
$g.DrawString("26-27 TEAM", $fontBar, $darkTextBrush, $cardLeft + 480 + 135, $barY + 28, $sfCenter)

$g.Dispose()
$logoBmp.Dispose()

$outputPath = "src/assets/test-ground-truth.png"
$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Saved to $outputPath"
