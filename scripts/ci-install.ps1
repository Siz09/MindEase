# CI installation helper script for PowerShell (Windows)
# Sets CYPRESS_INSTALL_BINARY=0 to skip binary download during npm install
# Usage: .\scripts\ci-install.ps1 [npm-command]
# Example: .\scripts\ci-install.ps1 ci
# Example: .\scripts\ci-install.ps1 install

$env:CYPRESS_INSTALL_BINARY = "0"

$npmCommand = if ($args.Count -gt 0) { $args[0] } else { "ci" }

Write-Host "🔧 Setting CYPRESS_INSTALL_BINARY=0 to skip Cypress binary download" -ForegroundColor Cyan
Write-Host "📦 Running: npm $npmCommand" -ForegroundColor Cyan

npm $npmCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Installation complete" -ForegroundColor Green
    Write-Host "   To install Cypress binary later, run: npx cypress install" -ForegroundColor Gray
} else {
    Write-Host "❌ Installation failed" -ForegroundColor Red
    exit $LASTEXITCODE
}
