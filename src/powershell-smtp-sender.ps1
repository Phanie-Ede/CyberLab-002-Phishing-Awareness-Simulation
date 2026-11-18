# CyberLab 002: Sanitised SMTP submission workflow
# Reconstructed from recovered PowerShell history, lines 530-599.
# This is a portfolio reference, not the exact original script.
# Use only with explicit authorisation and approved test recipients.

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $RecipientsCsv,
    [Parameter(Mandatory)] [string] $PreviewFolder,
    [Parameter(Mandatory)] [string] $LogPath,
    [Parameter(Mandatory)] [string] $SenderAddress,
    [Parameter(Mandatory)] [string] $SmtpHost,
    [Parameter(Mandatory)] [pscredential] $SmtpCredential,
    [string] $Subject = 'Approved awareness exercise',
    [int] $SmtpPort = 587,
    [int] $DelaySeconds = 3
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# The original recipient-import and preview-file naming logic was not
# recovered. This reconstruction assumes EmployeeID and Email CSV columns,
# and one HTML file named <EmployeeID>.html per approved recipient.
$campaignEmails = @(Import-Csv -LiteralPath $RecipientsCsv)
if ($campaignEmails.Count -eq 0) { throw 'Recipient CSV is empty.' }

$unresolved = @($campaignEmails | Where-Object {
    [string]::IsNullOrWhiteSpace($_.EmployeeID) -or
    [string]::IsNullOrWhiteSpace($_.Email) -or
    -not (Test-Path -LiteralPath (Join-Path $PreviewFolder ($_.EmployeeID + '.html')))
})
if ($unresolved.Count -gt 0) {
    throw "Missing recipient fields or preview files for $($unresolved.Count) record(s)."
}

Write-Host "Approved recipients: $($campaignEmails.Count)"
Write-Host "Sender: $SenderAddress"
$confirmation = Read-Host 'Type SEND to submit the approved simulation emails'
if ($confirmation -cne 'SEND') { Write-Host 'Cancelled.'; return }

$sendLog = @()
foreach ($person in $campaignEmails) {
    $mail = $null
    $smtp = $null
    try {
        $htmlPath = Join-Path $PreviewFolder ($person.EmployeeID + '.html')
        $html = Get-Content -LiteralPath $htmlPath -Raw -ErrorAction Stop

        $mail = [System.Net.Mail.MailMessage]::new()
        $mail.From = [System.Net.Mail.MailAddress]::new($SenderAddress, 'Awareness team')
        $mail.To.Add($person.Email)
        $mail.Subject = $Subject
        $mail.Body = $html
        $mail.IsBodyHtml = $true

        $smtp = [System.Net.Mail.SmtpClient]::new($SmtpHost, $SmtpPort)
        $smtp.EnableSsl = $true
        $smtp.Credentials = $SmtpCredential.GetNetworkCredential()
        $smtp.Send($mail)

        $sendLog += [PSCustomObject]@{
            EmployeeID = $person.EmployeeID
            Email      = $person.Email
            Status     = 'Submitted'
            Timestamp  = (Get-Date).ToString('o')
            Error      = ''
        }
        Write-Host "Submitted: $($person.EmployeeID)"
    }
    catch {
        $sendLog += [PSCustomObject]@{
            EmployeeID = $person.EmployeeID
            Email      = $person.Email
            Status     = 'Failed'
            Timestamp  = (Get-Date).ToString('o')
            Error      = $_.Exception.Message
        }
        Write-Warning "Submission failed for $($person.EmployeeID)"
    }
    finally {
        if ($null -ne $mail) { $mail.Dispose() }
        if ($null -ne $smtp) { $smtp.Dispose() }
        $sendLog | Export-Csv -LiteralPath $LogPath -NoTypeInformation
    }
    Start-Sleep -Seconds $DelaySeconds
}

Write-Host 'SMTP submission attempts completed. Check the CSV log for outcomes.'
