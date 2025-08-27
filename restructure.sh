#!/bin/bash

# Move to the project directory
cd "C:\Users\nikla\Documents\Finanztracker"

# Move all files from financeflow to root
cp -r financeflow/* .
cp -r financeflow/.* . 2>/dev/null || true

# Remove the now-empty financeflow directory
rm -rf financeflow

# Remove backup file if exists
rm -f vercel.json.backup

# Commit and push changes
git add -A
git status
echo "Ready to commit. Run: git commit -m 'Move Next.js app to repository root' && git push"
