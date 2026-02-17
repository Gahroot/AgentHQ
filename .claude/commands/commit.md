---
name: commit
description: Run checks, commit with AI message, and push
---

1. Run quality checks (fix ALL errors before continuing):
   ```bash
   npm run lint
   npm run build
   cd packages/cli && go vet ./... && gofmt -l .
   ```

2. Review changes: `git status` and `git diff --staged` and `git diff`

3. Stage changes: `git add -A`

4. Generate a commit message:
   - Start with verb (Add/Update/Fix/Remove/Refactor)
   - Be specific, concise, one line

5. Commit and push:
   ```bash
   git commit -m "your generated message"
   git push
   ```
