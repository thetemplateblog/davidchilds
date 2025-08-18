#!/bin/bash

# Install script for git hooks
# This script installs the commit-msg hook to prevent AI/Claude references

echo "Installing git hooks..."

# Get the git directory
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)

if [ -z "$GIT_DIR" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Copy the commit-msg hook
cp .githooks/commit-msg "$GIT_DIR/hooks/commit-msg"
chmod +x "$GIT_DIR/hooks/commit-msg"

echo "✅ Git hooks installed successfully!"
echo ""
echo "The following hook has been installed:"
echo "  - commit-msg: Prevents commits with AI/Claude references"
echo ""
echo "To test the hook, try committing with a message containing 'Claude' or '🤖'"