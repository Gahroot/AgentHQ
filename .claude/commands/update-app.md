---
name: update-app
description: Update dependencies, fix deprecations and warnings
---

# Dependency Update & Deprecation Fix

## Step 1: Check for Updates
```bash
npm outdated
cd packages/cli && go list -u -m all
```

## Step 2: Update Dependencies
```bash
npm update
npm audit fix
cd packages/cli && go get -u ./... && go mod tidy
```

## Step 3: Check for Deprecations & Warnings

Delete and reinstall — read ALL output carefully:
```bash
rm -rf node_modules package-lock.json
npm install
```

Look for: deprecation warnings, security vulnerabilities, peer dependency warnings, breaking changes.

## Step 4: Fix Issues

For each warning/deprecation:
1. Research the recommended replacement
2. Update code/dependencies accordingly
3. Re-run `npm install`
4. Verify no warnings remain

## Step 5: Run Quality Checks
```bash
npm run lint
npm run build
cd packages/cli && go vet ./... && gofmt -l .
```

Fix ALL errors before completing.

## Step 6: Verify Clean Install
```bash
rm -rf node_modules package-lock.json
npm install
```
Confirm ZERO warnings/errors and all dependencies resolve correctly.
