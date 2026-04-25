$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8080/')
$listener.Start()
Write-Host 'Server running on http://localhost:8080'

$root = 'c:\Users\surya\OneDrive\Desktop\PriceCompare-v2'

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $resp = $ctx.Response

    $url = $req.Url.LocalPath
    if ($url -eq '/') { $url = '/index.html' }

    $file = Join-Path $root $url.TrimStart('/')

    if (Test-Path $file) {
        $content = [System.IO.File]::ReadAllBytes($file)
        $ext = [System.IO.Path]::GetExtension($file)
        $ct = switch ($ext) {
            '.html' { 'text/html' }
            '.css'  { 'text/css' }
            '.js'   { 'application/javascript' }
            '.json' { 'application/json' }
            '.png'  { 'image/png' }
            '.jpg'  { 'image/jpeg' }
            '.svg'  { 'image/svg+xml' }
            default { 'application/octet-stream' }
        }
        $resp.ContentType = $ct
        $resp.ContentLength64 = $content.Length
        $resp.OutputStream.Write($content, 0, $content.Length)
    } else {
        $resp.StatusCode = 404
        $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not Found')
        $resp.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    $resp.Close()
}
