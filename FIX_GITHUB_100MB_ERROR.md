# Fix GitHub 100MB File Size Error - Step-by-Step Guide

## Prerequisites Check

**Step 1: Verify you're in the repository**
```powershell
cd "C:\Users\Nemitha\OneDrive\Documents\GitHub\Boarding Project - Product"
git status
```

**Step 2: Install git-filter-repo (if not installed)**
```powershell
# Check if Python is installed
python --version

# Install git-filter-repo using pip
pip install git-filter-repo

# If pip is not found, use pip3
pip3 install git-filter-repo
```

---

## Backup Repository

**Step 3: Create a full backup (handles spaces in path)**
```powershell
# Navigate to parent directory
cd "C:\Users\Nemitha\OneDrive\Documents\GitHub"

# Create backup with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item -Path "Boarding Project - Product" -Destination "Boarding Project - Product_BACKUP_$timestamp" -Recurse

# Verify backup was created
Test-Path "Boarding Project - Product_BACKUP_$timestamp"

# Return to project directory
cd "Boarding Project - Product"
```

---

## Identify Large Files

**Step 4: Find files larger than 50MB in Git history**
```powershell
# List all files in Git history with sizes
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | Where-Object { $_ -match '^blob' } | ForEach-Object { $parts = $_ -split '\s+'; [PSCustomObject]@{ Size = [int]$parts[2]; Path = ($parts[3..($parts.Length-1)] -join ' ') } } | Sort-Object -Property Size -Descending | Select-Object -First 20

# Alternative: Use git verify-pack to find large objects
git verify-pack -v .git\objects\pack\*.idx | Sort-Object { [int]($_ -split '\s+')[2] } -Descending | Select-Object -First 10
```

**Step 5: Identify the problematic file path**
```powershell
# Replace <FILE_HASH> with the hash from Step 4 output
git rev-list --objects --all | Select-String "<FILE_HASH>"
```

---

## Remove Large File from History

**Step 6: Remove large file from ALL commits using git-filter-repo**

**IMPORTANT:** Replace `path/to/large/file` with the actual file path found in Step 5.

```powershell
# Example: If the file is "Frontend/all-files.txt"
git filter-repo --path "Frontend/all-files.txt" --invert-paths

# Example: If the file is "Backend/large-file.zip"
git filter-repo --path "Backend/large-file.zip" --invert-paths

# Example: If multiple files need removal
git filter-repo --path "Frontend/all-files.txt" --path "Backend/all-files.txt" --invert-paths
```

**What this does:** Removes the specified file(s) from every commit in Git history, rewriting all commits.

---

## Update .gitignore

**Step 7: Add large file patterns to .gitignore**

Edit `.gitignore` in the root directory and add:

```
# Large files that should not be committed
all-files.txt
Frontend/all-files.txt
Backend/all-files.txt
*.zip
*.tar.gz
*.rar
*.7z
*.dmg
*.iso
*.exe
*.dll
*.so
*.dylib
```

**Step 8: Commit .gitignore update (if changed)**
```powershell
git add .gitignore
git commit -m "Add large file patterns to .gitignore"
```

---

## Verify Clean History

**Step 9: Verify the file is removed from history**
```powershell
# Check if file still exists in any commit
git log --all --full-history -- "path/to/large/file"

# Should return nothing if successfully removed

# Verify repository size
git count-objects -vH
```

**Step 10: Verify no large files remain**
```powershell
# Check for any files > 50MB in current working tree
Get-ChildItem -Recurse -File | Where-Object { $_.Length -gt 50MB } | Select-Object FullName, @{Name="SizeMB";Expression={[math]::Round($_.Length/1MB,2)}}
```

---

## Force Push to GitHub

**Step 11: Force push cleaned history to GitHub**

**WARNING:** This rewrites GitHub history. Only do this if you're the sole contributor.

```powershell
# Verify remote URL
git remote -v

# Force push to main branch (replace 'main' with your branch name if different)
git push origin main --force

# If you're on 'master' branch
git push origin master --force
```

**What this does:** Overwrites GitHub's history with your cleaned local history.

---

## Post-Push Verification

**Step 12: Verify on GitHub**
1. Go to your GitHub repository
2. Check that the large file is no longer in the history
3. Verify repository size decreased
4. Test that the repository still works correctly

---

## Troubleshooting

**If git-filter-repo is not found:**
```powershell
# Add Python Scripts to PATH (adjust Python version)
$env:Path += ";C:\Users\Nemitha\AppData\Local\Programs\Python\Python3XX\Scripts"
```

**If backup fails due to long paths:**
```powershell
# Enable long path support in PowerShell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

**If you need to restore from backup:**
```powershell
cd "C:\Users\Nemitha\OneDrive\Documents\GitHub"
Remove-Item -Path "Boarding Project - Product" -Recurse -Force
Copy-Item -Path "Boarding Project - Product_BACKUP_TIMESTAMP" -Destination "Boarding Project - Product" -Recurse
```

---

## Important Notes

- **Backup first:** Always create a backup before modifying Git history
- **Solo project only:** Force push is safe only if you're the only contributor
- **One-way operation:** History rewriting cannot be easily undone
- **Test locally:** Verify everything works before force pushing
- **Update .gitignore:** Prevent re-adding large files in the future







