param(
  [Parameter(Mandatory=$true)][string]$SourceArn,
  [Parameter(Mandatory=$true)][string]$DestinationArn,
  [Parameter(Mandatory=$true)][string]$Region,
  [int]$MaxPps = 50,
  [int]$Poll = 5,
  [switch]$Wait,
  [switch]$Yes,
  [switch]$DryRun
)

function ArnToUrl($arn) {
  $parts = $arn.Split(':')
  if ($parts.Length -lt 6 -or $parts[2] -ne 'sqs') { throw "Invalid SQS ARN: $arn" }
  $region = $parts[3]; $acct = $parts[4]; $name = $parts[5]
  return "https://sqs.$region.amazonaws.com/$acct/$name"
}

function GetAttr($url, $attr, $region) {
  aws sqs get-queue-attributes --queue-url $url --attribute-names $attr --region $region --query "Attributes.$attr" --output text
}

$srcUrl = ArnToUrl $SourceArn
$dstUrl = ArnToUrl $DestinationArn

Write-Host "Region: $Region"
Write-Host "Source DLQ: $SourceArn"
Write-Host "Dest:       $DestinationArn"
Write-Host "Max PPS:    $MaxPps"
if ($DryRun) { Write-Warning "DRY-RUN MODE" }

$dlqVis = GetAttr $srcUrl "ApproximateNumberOfMessages" $Region
$dlqInfl = GetAttr $srcUrl "ApproximateNumberOfMessagesNotVisible" $Region
Write-Host "DLQ visible: $dlqVis   in-flight: $dlqInfl"

if (-not $Yes -and -not $DryRun) {
  $ans = Read-Host "Proceed with redrive? [y/N]"
  if ($ans -notmatch '^[Yy]$') { throw "Aborted by user" }
}

if (-not $DryRun) {
  aws sqs start-message-move-task --source-arn $SourceArn --destination-arn $DestinationArn --max-number-of-messages-per-second $MaxPps --region $Region | Out-Null
  Write-Host "Move task started."
}

if ($Wait -and -not $DryRun) {
  $last = -1; $stagnant = 0
  while ($true) {
    Start-Sleep -Seconds $Poll
    $now = GetAttr $srcUrl "ApproximateNumberOfMessages" $Region
    $infl = GetAttr $srcUrl "ApproximateNumberOfMessagesNotVisible" $Region
    Write-Host ("  -> DLQ visible: {0}, in-flight: {1}" -f $now, $infl)
    if ($now -eq "0") { Write-Host "DLQ drained."; break }
    if ($now -eq $last) {
      $stagnant++
      if ($stagnant -ge 6) { Write-Warning "DLQ unchanged; exiting monitor."; break }
    } else { $stagnant = 0 }
    $last = $now
  }
}

