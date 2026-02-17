---
name: fix
description: Run typechecking and linting, then spawn parallel agents to fix all issues
---

# Project Code Quality Check

## Step 1: Run Linting and Typechecking

Run all checks and capture output:
```bash
npm run lint 2>&1
npm run typecheck 2>&1
cd packages/cli && go vet ./... 2>&1 && gofmt -l . 2>&1
```

## Step 2: Collect and Parse Errors

Parse the output from Step 1. Group errors by domain:
- **Type errors**: TypeScript compiler errors from `typecheck`
- **Lint errors**: ESLint errors/warnings from `lint`
- **Go errors**: `go vet` / `gofmt` issues

Create a list of all files with issues and the specific problems in each file.

## Step 3: Spawn Parallel Agents

For each domain that has issues, spawn an agent in parallel using the Task tool:

**IMPORTANT**: Use a SINGLE response with MULTIPLE Task tool calls to run agents in parallel.

- Spawn a "type-fixer" agent for TypeScript type errors
- Spawn a "lint-fixer" agent for ESLint errors
- Spawn a "go-fixer" agent for Go vet/fmt issues

Each agent should:
1. Receive the list of files and specific errors in their domain
2. Fix all errors
3. Re-run the relevant check command to verify fixes
4. Report completion

## Step 4: Verify All Fixes

After all agents complete, run the full check again:
```bash
npm run lint
npm run typecheck
cd packages/cli && go vet ./... && gofmt -l .
```

Ensure ZERO errors/warnings remain.
