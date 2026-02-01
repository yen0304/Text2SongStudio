**Pull Request Workflow**

Follow this workflow to create and submit pull requests.

## Prerequisites

1. Ensure all changes are committed following [commit.prompt.md](./commit.prompt.md)
2. Verify tests pass locally
3. Check `git status` shows clean working tree

## Steps

### 1. Analyze Current State

```bash
# Check current branch and commits ahead of origin
git status
git log --oneline origin/main..HEAD

# Verify remote configuration
git remote -v
```

### 2. Create Feature Branch

Branch naming convention: `<type>/<short-description>`

**Types:**
- `feat/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes
- `test/` - Test additions/changes
- `chore/` - Maintenance tasks

```bash
# Create and switch to new branch from current commits
git checkout -b feat/my-feature-name

# Or if you need to branch from main and cherry-pick
git checkout main
git checkout -b feat/my-feature-name
git cherry-pick <commit-hash>...
```

### 3. Push Branch to Remote

```bash
git push -u origin feat/my-feature-name
```

### 4. Create Pull Request via GitHub CLI

```bash
gh pr create \
  --title "<type>(<scope>): <description>" \
  --body "$(cat <<'EOF'
## Summary

Brief description of what this PR does.

## Changes

- Change 1
- Change 2
- Change 3

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass (if applicable)
- [ ] Manual testing completed

## Related Issues

Closes #<issue-number> (if applicable)
EOF
)"
```

### 5. Alternative: Create PR with Interactive Mode

```bash
# Opens editor for title and body
gh pr create --fill
```

## PR Title Format

Follow the same Conventional Commits format as commit messages:

```
<type>(<scope>): <description>
```

**Examples:**
- `feat(auth): add OAuth2 login support`
- `fix(api): resolve race condition in user creation`
- `docs: update API documentation`

## PR Body Template

```markdown
## Summary

A clear and concise description of what this PR accomplishes.

## Changes

- Bullet point list of changes
- Keep it high-level
- Group related changes together

## Testing

Describe how the changes were tested:
- [ ] Unit tests added/updated
- [ ] Manual testing performed
- [ ] All existing tests pass

## Screenshots (if applicable)

Add screenshots for UI changes.

## Breaking Changes (if applicable)

List any breaking changes and migration steps.

## Related Issues

- Closes #123
- Related to #456
```

## After Creating PR

1. **Review the PR** - Click the link provided by `gh pr create`
2. **Add reviewers** - `gh pr edit --add-reviewer <username>`
3. **Add labels** - `gh pr edit --add-label "enhancement"`
4. **Monitor CI** - Wait for CI checks to pass

## Useful Commands

```bash
# View PR status
gh pr status

# View specific PR
gh pr view <number>

# List open PRs
gh pr list

# Check out PR locally
gh pr checkout <number>

# Merge PR (after approval)
gh pr merge <number> --squash --delete-branch
```

## Branch Cleanup After Merge

```bash
# Delete local branch
git branch -d feat/my-feature-name

# Prune remote tracking branches
git fetch --prune
```

## Quick Reference

| Action | Command |
|--------|---------|
| Create branch | `git checkout -b feat/name` |
| Push branch | `git push -u origin feat/name` |
| Create PR | `gh pr create --title "..." --body "..."` |
| View PR | `gh pr view` |
| Merge PR | `gh pr merge --squash --delete-branch` |
