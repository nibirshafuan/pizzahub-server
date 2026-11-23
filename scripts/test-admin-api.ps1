$baseUrl = "http://localhost:5000"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$email = Read-Host "Admin account email"
$securePassword = Read-Host "Admin password" -AsSecureString
$credential = New-Object System.Management.Automation.PSCredential($email, $securePassword)
$password = $credential.GetNetworkCredential().Password

$loginBody = @{
    email = $email
    password = $password
    rememberMe = $true
} | ConvertTo-Json -Compress

$password = $null
$credential = $null

try {
    Write-Host "`nSigning in to PizzaHub..."

    $loginResponse = Invoke-RestMethod `
        -Uri "$baseUrl/api/auth/sign-in/email" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody `
        -WebSession $session

    $loginBody = $null

    Write-Host "Login request completed."
    Write-Host "`nTesting Admin Pending Menu API..."

    $response = Invoke-RestMethod `
        -Uri "$baseUrl/api/admin/menu/pending" `
        -Method Get `
        -WebSession $session

    Write-Host "`nAdmin API response:"
    $response | ConvertTo-Json -Depth 10
}
catch {
    $loginBody = $null
    $password = $null

    Write-Host "`nAPI test failed." -ForegroundColor Red
    Write-Host $_.Exception.Message

    if ($_.Exception.Response) {
        Write-Host "HTTP Status:" $_.Exception.Response.StatusCode
    }
}
finally {
    $securePassword = $null
    $credential = $null
}
