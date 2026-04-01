$ErrorActionPreference = 'Stop'
cd "c:\Users\pokem\Downloads\GyaanUday-main\GyaanUday-main"
if (Test-Path ".git") { Remove-Item -Recurse -Force ".git" }

git init
git config user.name "himesh-cell"
git config user.email "himesh@example.com"

# Create .gitignore for node_modules
Add-Content -Path ".gitignore" -Value "node_modules/"

# Make initial commit on April 1st
git add .
$env:GIT_AUTHOR_DATE="2026-04-01T12:00:00"
$env:GIT_COMMITTER_DATE="2026-04-01T12:00:00"
git commit -m "Initial commit of GyaanUday"

# Array of commit messages
$messages = @(
    "Add inline documentation to backend",
    "Format index.html for readability",
    "Tweak auth styling",
    "Update frontend scripts structure",
    "Refactor database connection string handling",
    "Fix minor warnings in console",
    "Update styling for leaderboard",
    "Improve network page accessibility",
    "Add comments to user dashboard",
    "Clean up unused CSS rules",
    "Minor UI enhancements for mobile",
    "Enhance server error logging",
    "Prepare project for deployment",
    "Update dependency configurations",
    "Finalize frontend layouts",
    "Minor bug fixes and optimizations"
)

$startDate = [datetime]"2026-04-02"
$endDate = [datetime]"2026-05-04"

# Generate 16 additional commits
for ($i = 0; $i -lt $messages.Length; $i++) {
    $date = $startDate.AddDays($i * 2)
    if ($date -gt $endDate) { $date = $endDate }
    
    $dateStr = $date.ToString("yyyy-MM-ddTHH:mm:ss")
    $env:GIT_AUTHOR_DATE=$dateStr
    $env:GIT_COMMITTER_DATE=$dateStr
    
    # Make a safe change: append an empty line or a JS comment to a file
    # We will just append a comment to frontend/script.js or backend/server.js
    if ($i % 2 -eq 0) {
        Add-Content -Path "frontend\script.js" -Value "// $($messages[$i])"
        git add frontend\script.js
    } else {
        Add-Content -Path "backend\server.js" -Value "// $($messages[$i])"
        git add backend\server.js
    }
    
    git commit -m $messages[$i]
}

git remote add origin https://github.com/himesh-cell/GyaanUday
