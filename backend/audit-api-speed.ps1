$tests = @(
  @{
    Name = "Health"
    Url  = "http://localhost:4000/api/health"
  },
  @{
    Name = "JoSAA recommendations"
    Url  = "http://localhost:4000/api/v1/recommendations?examId=jee-main&rank=30000&category=OPEN&year=2026&round=1&branchPreferences=CSE,IT&annualBudget=1000000&gender=Male&homeState=Maharashtra&locationMode=NONE&limit=100"
  },
  @{
    Name = "CSAB recommendations"
    Url  = "http://localhost:4000/api/v1/recommendations?examId=csab&rank=30000&category=OPEN&year=2026&round=1&branchPreferences=CSE,IT&annualBudget=1000000&gender=Male&homeState=Maharashtra&locationMode=NONE&limit=100"
  },
  @{
    Name = "Colleges"
    Url  = "http://localhost:4000/api/colleges"
  },
  @{
    Name = "Exams"
    Url  = "http://localhost:4000/api/exams"
  }
)

foreach ($test in $tests) {

  Write-Host ""
  Write-Host "======================================"
  Write-Host $test.Name
  Write-Host "======================================"

  1..3 | ForEach-Object {

    $sw =
      [System.Diagnostics.Stopwatch]::StartNew()

    try {

      $response =
        Invoke-WebRequest `
          -Uri $test.Url `
          -UseBasicParsing

      $sw.Stop()

      Write-Host `
        "Run $_ | Status $($response.StatusCode) | $($sw.ElapsedMilliseconds) ms"

    }
    catch {

      $sw.Stop()

      Write-Host `
        "Run $_ | ERROR | $($sw.ElapsedMilliseconds) ms | $($_.Exception.Message)"
    }
  }
}
