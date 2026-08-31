Add-Type -AssemblyName System.Drawing

$assetsDir = 'C:\Users\mchetansivaram\.gemini\antigravity\scratch\HabitUp\assets'
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
}

function Generate-FramedAppIcon($filePath, $width, $height) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # 1. Fill entire canvas with Deep Sleek Black
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0A0F1D'))
    $g.FillRectangle($bgBrush, 0, 0, $width, $height)

    # 2. Draw centered Squircle Tile with Crisp White Border
    $tileSize = [int]($width * 0.74)
    $tileX = [int](($width - $tileSize) / 2)
    $tileY = [int](($height - $tileSize) / 2)
    $radius = [int]($tileSize * 0.28)

    $pathObj = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $pathObj.AddArc($tileX, $tileY, $d, $d, 180, 90)
    $pathObj.AddArc($tileX + $tileSize - $d, $tileY, $d, $d, 270, 90)
    $pathObj.AddArc($tileX + $tileSize - $d, $tileY + $tileSize - $d, $d, $d, 0, 90)
    $pathObj.AddArc($tileX, $tileY + $tileSize - $d, $d, $d, 90, 90)
    $pathObj.CloseFigure()

    # Fill Rich DARK BLUE Gradient inside the white box
    $tileRect = New-Object System.Drawing.Rectangle($tileX, $tileY, $tileSize, $tileSize)
    $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $tileRect,
        [System.Drawing.ColorTranslator]::FromHtml('#1E40AF'),
        [System.Drawing.ColorTranslator]::FromHtml('#0F172A'),
        45.0
    )
    $g.FillPath($gradBrush, $pathObj)

    # Crisp Solid White Border
    $borderWidth = [float]($width * 0.016)
    $whiteBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $borderWidth)
    $g.DrawPath($whiteBorderPen, $pathObj)

    # 3. Stylized 'H.' with Growth Arrow & Orange Dot
    $strokeWidth = [float]($tileSize * 0.095)
    $penWhite = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $strokeWidth)
    $penWhite.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penWhite.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    # Left vertical leg
    $lx = $tileX + [int]($tileSize * 0.31)
    $ly1 = $tileY + [int]($tileSize * 0.27)
    $ly2 = $tileY + [int]($tileSize * 0.73)
    $g.DrawLine($penWhite, $lx, $ly1, $lx, $ly2)

    # Horizontal crossbar
    $rx = $tileX + [int]($tileSize * 0.69)
    $my = $tileY + [int]($tileSize * 0.52)
    $g.DrawLine($penWhite, $lx, $my, $rx, $my)

    # Right vertical leg (Emerald green)
    $penGreen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#00E599'), $strokeWidth)
    $penGreen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penGreen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($penGreen, $rx, $my, $rx, $ly2)
    $g.DrawLine($penGreen, $rx, $my, $rx, $ly1 + [int]($tileSize * 0.08))

    # Upward Arrowhead on right leg
    $arrowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $topX = [float]$rx
    $topY = [float]($ly1 - ($tileSize * 0.10))
    $aw = [float]($tileSize * 0.17)
    $ah = [float]($tileSize * 0.18)

    $p1 = New-Object System.Drawing.PointF($topX, $topY)
    $p2 = New-Object System.Drawing.PointF(($topX - $aw), ($topY + $ah))
    $p3 = New-Object System.Drawing.PointF(($topX + $aw), ($topY + $ah))
    $arrowPath.AddPolygon([System.Drawing.PointF[]]@($p1, $p2, $p3))
    $greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#00E599'))
    $g.FillPath($greenBrush, $arrowPath)

    # Golden Sparkle Accent Dot
    $dotX = $rx + [int]($tileSize * 0.14)
    $dotY = $ly2 - [int]($tileSize * 0.01)
    $amberBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#FFB800'))
    $dotSize = [int]($tileSize * 0.13)
    $g.FillEllipse($amberBrush, $dotX, $dotY - $dotSize, $dotSize, $dotSize)

    $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output ("Generated Dark Blue & White Border Icon: " + $filePath)
}

function Generate-Splash($filePath, $width, $height) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0A0F1D'))
    $g.FillRectangle($bgBrush, 0, 0, $width, $height)

    # Draw centered squircle icon with dark blue inside & white border
    $tileSize = [int]($width * 0.32)
    $tileX = [int](($width - $tileSize) / 2)
    $tileY = [int](($height - $tileSize) / 2 - ($height * 0.02))
    $radius = [int]($tileSize * 0.28)

    $pathObj = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $pathObj.AddArc($tileX, $tileY, $d, $d, 180, 90)
    $pathObj.AddArc($tileX + $tileSize - $d, $tileY, $d, $d, 270, 90)
    $pathObj.AddArc($tileX + $tileSize - $d, $tileY + $tileSize - $d, $d, $d, 0, 90)
    $pathObj.AddArc($tileX, $tileY + $tileSize - $d, $d, $d, 90, 90)
    $pathObj.CloseFigure()

    $rect = New-Object System.Drawing.Rectangle($tileX, $tileY, $tileSize, $tileSize)
    $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.ColorTranslator]::FromHtml('#1E40AF'),
        [System.Drawing.ColorTranslator]::FromHtml('#0F172A'),
        45.0
    )
    $g.FillPath($gradBrush, $pathObj)

    $borderWidth = [float]($tileSize * 0.035)
    $whiteBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $borderWidth)
    $g.DrawPath($whiteBorderPen, $pathObj)

    $strokeWidth = [float]($tileSize * 0.095)
    $penWhite = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $strokeWidth)
    $penWhite.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penWhite.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    $lx = $tileX + [int]($tileSize * 0.31)
    $ly1 = $tileY + [int]($tileSize * 0.27)
    $ly2 = $tileY + [int]($tileSize * 0.73)
    $g.DrawLine($penWhite, $lx, $ly1, $lx, $ly2)

    $rx = $tileX + [int]($tileSize * 0.69)
    $my = $tileY + [int]($tileSize * 0.52)
    $g.DrawLine($penWhite, $lx, $my, $rx, $my)

    $penGreen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#00E599'), $strokeWidth)
    $penGreen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penGreen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($penGreen, $rx, $my, $rx, $ly2)
    $g.DrawLine($penGreen, $rx, $my, $rx, $ly1 + [int]($tileSize * 0.08))

    $arrowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $topX = [float]$rx
    $topY = [float]($ly1 - ($tileSize * 0.10))
    $aw = [float]($tileSize * 0.17)
    $ah = [float]($tileSize * 0.18)

    $p1 = New-Object System.Drawing.PointF($topX, $topY)
    $p2 = New-Object System.Drawing.PointF(($topX - $aw), ($topY + $ah))
    $p3 = New-Object System.Drawing.PointF(($topX + $aw), ($topY + $ah))
    $arrowPath.AddPolygon([System.Drawing.PointF[]]@($p1, $p2, $p3))
    $greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#00E599'))
    $g.FillPath($greenBrush, $arrowPath)

    $dotX = $rx + [int]($tileSize * 0.14)
    $dotY = $ly2 - [int]($tileSize * 0.01)
    $amberBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#FFB800'))
    $dotSize = [int]($tileSize * 0.13)
    $g.FillEllipse($amberBrush, $dotX, $dotY - $dotSize, $dotSize, $dotSize)

    $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output ("Generated Splash: " + $filePath)
}

# 1. Icon (1024x1024)
Generate-FramedAppIcon (Join-Path $assetsDir 'icon.png') 1024 1024

# 2. Adaptive Icon (1024x1024)
Generate-FramedAppIcon (Join-Path $assetsDir 'adaptive-icon.png') 1024 1024

# 3. Splash Screen (1284x2778)
Generate-Splash (Join-Path $assetsDir 'splash.png') 1284 2778

# 4. Favicon (192x192)
Generate-FramedAppIcon (Join-Path $assetsDir 'favicon.png') 192 192
