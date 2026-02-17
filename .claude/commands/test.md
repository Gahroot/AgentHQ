Run the full test suite across all packages.

## Commands

### All tests (TypeScript + Go)
```bash
npm run test && cd packages/cli && go test ./...
```

### Server only
```bash
npm run test:server
```

### SDK only
```bash
npm run test:sdk
```

### Go CLI only
```bash
cd packages/cli && go test ./...
```

### Watch mode (re-runs on file changes)
```bash
npm run test:server -- --watch
```

### Coverage
```bash
npm run test:coverage
```

### Filter tests by name
```bash
npm run test:server -- --reporter=verbose -t "pattern"
```

## Instructions

1. Run the full test suite with the commands above
2. If any tests fail, read the failing test file and the source file it tests
3. Spawn parallel agents to fix failures in different packages simultaneously
4. Re-run only the affected package tests to verify fixes
5. Run the full suite one final time to confirm no regressions
