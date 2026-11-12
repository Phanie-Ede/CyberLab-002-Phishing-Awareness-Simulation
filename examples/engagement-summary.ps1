# Illustrative example only: analyse an anonymised, locally exported report.
# This does not connect to the live tracking service or contain credentials.
param([Parameter(Mandatory=$true)][string]$ReportPath)
$report = Get-Content -LiteralPath $ReportPath -Raw | ConvertFrom-Json
$employees = @($report.participants | Where-Object { $_.employeeId -match '^PMO\d{3}$' })
[pscustomobject]@{
    Enrolled = $employees.Count
    RecordedClicks = @($employees | Where-Object { $_.emailClicks -gt 0 }).Count
    RecordedVisits = @($employees | Where-Object { $_.pageVisits -gt 0 }).Count
    RecordedSubmitAttempts = @($employees | Where-Object { $_.submitAttempts -gt 0 }).Count
}
# WARNING: Counts above are raw and may include setup events or automated link previews.
# Use the evaluation plan to clean and interpret results before publication.
