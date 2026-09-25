$nvidiaApiKey = ((Get-Content "$PSScriptRoot/../.env" | Where-Object { $_ -match '^NVIDIA_API_KEY=' }) -replace '^NVIDIA_API_KEY=', '')
$headers = @{ Authorization = "Bearer $nvidiaApiKey"; 'Content-Type' = 'application/json' }
$models = @(
  'mistralai/mistral-nemotron',
  'z-ai/glm-5.3-flash',
  'z-ai/glm-5.3',
  'poolside/laguna-xs-2.1',
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'openai/gpt-oss-20b'
)

foreach ($candidate in $models) {
  $payload = @{
    model = $candidate
    messages = @(@{ role = 'user'; content = 'Reply exactly OK' })
    max_tokens = 16
    temperature = 0
    stream = $false
  } | ConvertTo-Json -Depth 5 -Compress
  $watch = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $reply = Invoke-RestMethod -Uri 'https://integrate.api.nvidia.com/v1/chat/completions' -Method Post -Headers $headers -Body $payload -TimeoutSec 40 -ErrorAction Stop
    $watch.Stop()
    $content = ($reply.choices[0].message.content -replace '\s+', ' ').Trim()
    Write-Output ("model=$candidate status=200 elapsed_ms=$($watch.ElapsedMilliseconds) content=$($content.Substring(0, [Math]::Min(80, $content.Length)))")
  } catch {
    $watch.Stop()
    $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 'no-http-status' }
    Write-Output ("model=$candidate status=$status elapsed_ms=$($watch.ElapsedMilliseconds) error=$($_.Exception.Message)")
  }
}
