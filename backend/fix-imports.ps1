# Fix imports in all JS files in dist folder
Get-ChildItem -Path "dist" -Filter "*.js" -Recurse | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content $file -Raw
    $originalContent = $content
    
    # Fix relative imports that don't end with .js
    # Matches: from "./something" or from "../something"
    $content = $content -replace 'from\s+([''"])(\.\./[^''"]+?)(?<!\.js)\1', 'from $1$2.js$1'
    $content = $content -replace 'from\s+([''"])(\./[^''"]+?)(?<!\.js)\1', 'from $1$2.js$1'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file -Value $content -NoNewline
        Write-Host "Fixed: $file"
    }
}

Write-Host "`nAll imports fixed!"