$ErrorActionPreference = "Stop";
$PSDefaultParameterValues['*:ErrorAction']='Stop'

$SolutionPath = Split-Path -Parent $PSCommandPath;
cd $SolutionPath;

function ScriptFailure {
  Write-Host "`n  Failure, exiting" -BackgroundColor Red -ForegroundColor White;
  exit;
}

Write-Host "`n  Restoring Solution" -BackgroundColor White -ForegroundColor Black;

dotnet restore;

if(!$?) { ScriptFailure; }

Write-Host "`n  Building Solution" -BackgroundColor White -ForegroundColor Black;
dotnet build;

if(!$?) { ScriptFailure; }

Write-Host "`n  Running Tests" -BackgroundColor White -ForegroundColor Black;
dotnet test --verbosity normal;

if(!$?) { ScriptFailure; }
Write-Host "`n  Tests Successful" -BackgroundColor DarkGreen -ForegroundColor White;
