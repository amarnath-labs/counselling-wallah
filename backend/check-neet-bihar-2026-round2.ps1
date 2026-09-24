$response = Invoke-WebRequest `
  "https://bceceboard.bihar.gov.in/" `
  -UseBasicParsing

$html = $response.Content

$patterns = @(
  "Second Round Opening and Closing Rank of UGMAC-2026",
  "Round-2 Opening and Closing Rank of UGMAC-2026",
  "Second Round Seat Allotment Result of UGMAC-2026"
)

$found = $false

foreach ($pattern in $patterns) {

  if ($html -match [regex]::Escape($pattern)) {

    Write-Host "FOUND:" $pattern
    $found = $true

  }

}

if (-not $found) {

  Write-Host "UGMAC-2026 Round 2 ORCR is not published yet."

}
