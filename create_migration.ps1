param([string]$MigrationName)

$ErrorActionPreference="Stop";

if([string]::IsNullOrWhiteSpace($MigrationName)) {
  Write-Host -ForegroundColor Red "Missing migration name";
  exit -1;
}

Write-Host -ForegroundColor Blue "Creating Migration '$MigrationName'";
Write-Host -ForegroundColor Cyan "Reading .env file..";

if((Test-Path .\.env) -eq $false) {
  Write-Host -ForegroundColor Red "Missing .env file";
  exit -1;
}

[System.Collections.ArrayList] $environment_variables = @();

foreach($line in Get-Content .\.env) {
  [string]$content = $line.Trim();

  if ($content.StartsWith("#") -eq $false) {

    [string[]] $var = $line.Split("=");

    if($var.Length -eq 2) {
     Write-Host Setting $var[0];
     
     $envkey = $var[0];
     $envval = $var[1];
     
     if(Test-Path env:\$envkey) {
       Remove-Item env:\$envkey;
     }

     New-Item env:\$envkey -Value $envval > $null;
     $environment_variables.Add(@($envkey)) > $null;
    }
  }
}

Write-Host -ForegroundColor Cyan "Adding migration";

dotnet ef migrations add $MigrationName --project RaceAnnouncer.Schema --startup-project RaceAnnouncer.Common;

Write-Host -ForegroundColor Cyan "Clearing environment variables..";

foreach($key in $environment_variables) {
  if(Test-Path env:\$envkey) {
    Remove-Item env:\$envkey;
  }
}

Write-Host "Done!";