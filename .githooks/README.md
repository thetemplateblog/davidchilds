# Git Hooks

This directory contains git hooks to maintain commit message quality and prevent AI attribution in commit messages.

## Installation

Run the install script to set up the hooks:

```bash
bash .githooks/install.sh
```

Or manually copy the hooks:

```bash
cp .githooks/commit-msg .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```

## Hooks Included

### commit-msg
Prevents commits that contain references to AI assistance, including:
- Claude, Anthropic
- AI-generated, AI assisted
- 🤖 emoji
- Co-authored-by AI attributions
- Generated with [tool] messages

## Testing

To test that the hook is working, try to commit with a blocked pattern:

```bash
git commit -m "This was generated with Claude"
# Should fail with an error message
```

## Bypassing (Emergency Only)

If you absolutely need to bypass the hook in an emergency:

```bash
git commit --no-verify -m "Your message"
```

**Note:** This should only be used in exceptional circumstances.