# Quick script to find large files in Git history
# Run this from the repository root

Write-Host "Finding large files in Git history..." -ForegroundColor Yellow

# Method 1: List all objects with sizes
Write-Host "`nMethod 1: Large objects in pack files" -ForegroundColor Cyan
$packFiles = Get-ChildItem -Path ".git\objects\pack\*.idx" -ErrorAction SilentlyContinue
if ($packFiles) {
    foreach ($packFile in $packFiles) {
        git verify-pack -v $packFile.FullName | 
            Where-Object { $_ -match '^[a-f0-9]{40}\s+blob' } | 
            ForEach-Object {
                $parts = $_ -split '\s+'
                if ($parts.Length -ge 4) {
                    $size = [int64]$parts[2]
                    if ($size -gt 10MB) {
                        $sizeMB = [math]::Round($size / 1MB, 2)
                        Write-Host "Size: $sizeMB MB - Hash: $($parts[0])" -ForegroundColor Red
                    }
                }
            }
    }
} else {
    Write-Host "No pack files found" -ForegroundColor Yellow
}

# Method 2: Find file paths for large objects
Write-Host "`nMethod 2: Finding file paths..." -ForegroundColor Cyan
Write-Host "This may take a while..." -ForegroundColor Yellow

git rev-list --objects --all | 
    ForEach-Object {
        $parts = $_ -split '\s+', 2
        if ($parts.Length -eq 2) {
            $hash = $parts[0]
            $path = $parts[1]
            $size = (git cat-file -s $hash 2>$null)
            if ($size -and $size -gt 10MB) {
                $sizeMB = [math]::Round($size / 1MB, 2)
                Write-Host "Size: $sizeMB MB - Path: $path - Hash: $hash" -ForegroundColor Red
            }
        }
    }

Write-Host "`nDone! Use the file path(s) above with git-filter-repo" -ForegroundColor Green

