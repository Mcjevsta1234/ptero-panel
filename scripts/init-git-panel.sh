#!/bin/bash
# Initialize git management for a Pterodactyl panel instance.
# Usage: bash scripts/init-git-panel.sh /var/www/pterodactyl
set -e

TARGET_DIR="$1"
if [ -z "$TARGET_DIR" ]; then
  echo "Provide panel directory: bash scripts/init-git-panel.sh /var/www/pterodactyl" >&2
  exit 1
fi
if [ ! -d "$TARGET_DIR" ]; then
  echo "Directory not found: $TARGET_DIR" >&2
  exit 1
fi
cd "$TARGET_DIR"

if [ -d .git ]; then
  echo "Git already initialized in $TARGET_DIR" >&2
  exit 0
fi

read -p "Git user.name (e.g. Admin): " GIT_USER
read -p "Git user.email: " GIT_EMAIL
read -p "Remote origin URL (empty to skip): " ORIGIN_URL
read -p "Add upstream remote? (y/N): " ADD_UPSTREAM
if [[ "$ADD_UPSTREAM" =~ ^[Yy]$ ]]; then
  read -p "Upstream URL (official repo): " UPSTREAM_URL
fi

# Create .gitignore (skip if exists)
if [ ! -f .gitignore ]; then
cat > .gitignore <<'EOF'
/vendor/
/node_modules/
/public/assets/
/public/themes/
/public/reviactyl/
/public/js/
/public/styles/
/public/favicons/
/storage/logs/
/storage/framework/*
/storage/clockwork/
/storage/app/backups/
.env
.env.*
.phpunit.result.cache
.idea/
*.sql
*.log
npm-debug.log*
yarn-error.log*
/coverage/
.DS_Store
# Build artifacts
/public/mix-manifest.json
EOF
  echo "Created .gitignore"
else
  echo ".gitignore already exists; leaving unchanged"
fi

git init
git config user.name "$GIT_USER"
git config user.email "$GIT_EMAIL"

# Safety: never commit .env
if git ls-files --error-unmatch .env 2>/dev/null; then
  git rm --cached .env
fi

echo "Staging tracked sources (excluding ignored paths)" 
# Use add then unstage sensitive patterns explicitly just in case
git add . || true
# Double-safety unstage patterns
git restore --staged .env || true

git commit -m "Initial snapshot of panel state" || echo "Nothing to commit (empty?)"

git branch -M main

if [ -n "$ORIGIN_URL" ]; then
  git remote add origin "$ORIGIN_URL"
  echo "Added origin remote: $ORIGIN_URL"
  git push -u origin main || echo "Push failed (check credentials)"
else
  echo "No origin URL provided; skipping push"
fi

git checkout -b experimental || echo "Branch create failed"
if [ -n "$ORIGIN_URL" ]; then
  git push -u origin experimental || echo "Experimental branch push failed"
fi

if [ -n "$UPSTREAM_URL" ]; then
  git remote add upstream "$UPSTREAM_URL"
  echo "Added upstream remote: $UPSTREAM_URL"
fi

echo "\nGit initialization complete." 
echo "Branches: main, experimental"
if [ -n "$ORIGIN_URL" ]; then
  echo "Check remote: git remote -v"
fi
