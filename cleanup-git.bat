@echo off
echo ========================================
echo Git Repository Cleanup Script
echo ========================================
echo.

echo Removing sensitive files from git...
echo.

REM Remove security documentation
git rm --cached SECURITY_FIXES_FINAL.md 2>nul
git rm --cached SECURITY_README.md 2>nul
git rm --cached SECURITY_STATUS_LATEST.md 2>nul
git rm --cached URGENT_FIXES_NOW.md 2>nul
git rm --cached IMPLEMENTATION_CHECKLIST.md 2>nul
git rm --cached QUICK_IMPLEMENTATION.md 2>nul
git rm --cached SECURITY_SUMMARY.md 2>nul
git rm --cached GIT_SECURITY_CHECK.md 2>nul

REM Remove database dumps with data
git rm --cached dump\data.sql 2>nul
git rm --cached dump\rls_policies_critical.sql 2>nul
git rm --cached dump\backups_table.sql 2>nul

echo.
echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo Files removed from git (kept locally):
echo - Security documentation files
echo - Database dump files
echo.
echo Next steps:
echo 1. Review changes: git status
echo 2. Commit: git commit -m "chore: Remove sensitive docs"
echo 3. Push: git push origin main
echo.
pause
