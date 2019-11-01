$ErrorActionPreference = "Stop";
$PSDefaultParameterValues['*:ErrorAction']='Stop'

$SolutionPath = Split-Path -Parent $PSCommandPath;
cd $SolutionPath;

$StartupProject = 'RaceAnnouncer.Bot';
$StartupProjectPath = Join-Path -Path $SolutionPath -ChildPath $StartupProject;

$SchemaProject = 'RaceAnnouncer.Schema';
$SchemaProjectPath = Join-Path -Path $SolutionPath -ChildPath $SchemaProject;

function ScriptFailure {
  Write-Host "`n  Rebuild failed, exiting" -BackgroundColor Red -ForegroundColor White;
  exit;
}

Write-Host "`n  Testing for .env file" -BackgroundColor White -ForegroundColor Black;

if (!(Test-Path -Path "$StartupProjectPath/.env" -PathType Leaf)) {
  Write-Host ".env file missing in $StartupProjectPath";
  ScriptFailure;
} else {
  Write-Host ".env file found!";
}

$MigrationsFolderPath = Join-Path -Path $SchemaProjectPath -ChildPath "Migrations"

Remove-Item "$MigrationsFolderPath" -Recurse -ErrorAction Ignore;

Write-Host "`n  Restoring Project" -BackgroundColor White -ForegroundColor Black;

dotnet restore;

if(!$?) { ScriptFailure; }

Write-Host "`n  Building Project" -BackgroundColor White -ForegroundColor Black;
dotnet build;

if(!$?) { ScriptFailure; }

Write-Host "`n  Dropping Database" -BackgroundColor White -ForegroundColor Black;
dotnet ef database drop -f --project $SchemaProject --startup-project $StartupProject;

if(!$?) { ScriptFailure; }

Write-Host "`n  Generating Migration" -BackgroundColor White -ForegroundColor Black;
dotnet ef migrations add InitialMigration --project $SchemaProject --startup-project $StartupProject;

if(!$?) { ScriptFailure; }

Write-Host "`n  Applying Migration" -BackgroundColor White -ForegroundColor Black;
dotnet ef database update --project $SchemaProject --startup-project $StartupProject;

if(!$?) { ScriptFailure; }

Write-Host "`n  Rebuild Successful" -BackgroundColor DarkGreen -ForegroundColor White;