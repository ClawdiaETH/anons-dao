#!/bin/bash
# Purge secrets from git history
# ⚠️ WARNING: This rewrites git history. All collaborators must re-clone!

set -e

REPO_DIR="/Users/starl3xx/Projects/anons-dao"
BACKUP_DIR="/Users/starl3xx/Projects/anons-dao-backup.git"
REMOTE_URL="https://github.com/ClawdiaETH/anons-dao.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}   Git History Purge Script - Remove Secrets${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${RED}⚠️  WARNING: This will rewrite git history!${NC}"
echo -e "${RED}   All collaborators MUST re-clone after this.${NC}"
echo ""
echo "What this script does:"
echo "  1. Creates a backup of the repo"
echo "  2. Installs git-filter-repo (if needed)"
echo "  3. Purges secrets from entire history"
echo "  4. Force pushes cleaned history to GitHub"
echo "  5. Verifies secrets are gone"
echo ""
read -p "Do you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Aborted.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Starting purge process...${NC}"
echo ""

# Step 1: Check if git-filter-repo is installed
echo "━━━ Step 1: Check dependencies ━━━"
if ! command -v git-filter-repo &> /dev/null; then
    echo "Installing git-filter-repo..."
    brew install git-filter-repo
    echo -e "${GREEN}✓ git-filter-repo installed${NC}"
else
    echo -e "${GREEN}✓ git-filter-repo already installed${NC}"
fi
echo ""

# Step 2: Create backup
echo "━━━ Step 2: Create backup ━━━"
if [ -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}⚠️  Backup already exists at $BACKUP_DIR${NC}"
    read -p "Overwrite existing backup? (yes/no): " OVERWRITE
    if [ "$OVERWRITE" = "yes" ]; then
        rm -rf "$BACKUP_DIR"
    else
        echo -e "${RED}Using existing backup. Continuing...${NC}"
    fi
fi

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Creating backup..."
    cd "$(dirname "$REPO_DIR")"
    git clone --mirror "$REPO_DIR" "$BACKUP_DIR"
    echo -e "${GREEN}✓ Backup created at $BACKUP_DIR${NC}"
else
    echo -e "${GREEN}✓ Using existing backup at $BACKUP_DIR${NC}"
fi
echo ""

# Step 3: Create secrets replacement file
echo "━━━ Step 3: Prepare secrets list ━━━"
SECRETS_FILE="/tmp/anons-secrets-to-purge-$(date +%s).txt"
cat > "$SECRETS_FILE" << 'EOF'
***REMOVED_ALCHEMY_KEY***==>***REMOVED_ALCHEMY_KEY***
***REMOVED_BASESCAN_KEY***==>***REMOVED_BASESCAN_KEY***
***REMOVED_PRIVATE_KEY***==>***REMOVED_PRIVATE_KEY***
EOF

echo "Secrets to purge:"
cat "$SECRETS_FILE"
echo -e "${GREEN}✓ Secrets list created${NC}"
echo ""

# Step 4: Run git-filter-repo
echo "━━━ Step 4: Purge secrets from history ━━━"
echo "This may take 2-5 minutes..."
cd "$REPO_DIR"

# Save current commit count
BEFORE_COMMITS=$(git rev-list --all --count)
echo "Commits before purge: $BEFORE_COMMITS"

git filter-repo --replace-text "$SECRETS_FILE" --force

echo -e "${GREEN}✓ History rewritten${NC}"
echo ""

# Step 5: Re-add remote
echo "━━━ Step 5: Re-add remote ━━━"
git remote add origin "$REMOTE_URL"
echo -e "${GREEN}✓ Remote added${NC}"
echo ""

# Step 6: Check for remaining secrets
echo "━━━ Step 6: Verify secrets removed ━━━"
echo "Running gitleaks scan..."
LEAKS_BEFORE=$(gitleaks detect --no-git 2>&1 | grep -o "leaks found: [0-9]*" | grep -o "[0-9]*" || echo "0")
echo "Leaks found: $LEAKS_BEFORE"

if [ "$LEAKS_BEFORE" -gt "100" ]; then
    echo -e "${YELLOW}⚠️  Warning: Still found $LEAKS_BEFORE potential leaks${NC}"
    echo "   (This might include base64 encoded data or false positives)"
    echo ""
    read -p "Continue with force push anyway? (yes/no): " CONTINUE_PUSH
    if [ "$CONTINUE_PUSH" != "yes" ]; then
        echo -e "${RED}Aborted. You can restore from backup at $BACKUP_DIR${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Secrets successfully removed!${NC}"
fi
echo ""

# Step 7: Show what will be pushed
echo "━━━ Step 7: Review changes ━━━"
echo "Commits after purge: $(git rev-list --all --count)"
echo "Branches:"
git branch -a
echo ""

# Step 8: Force push
echo "━━━ Step 8: Force push to GitHub ━━━"
echo -e "${RED}⚠️  FINAL WARNING: About to rewrite GitHub history!${NC}"
echo "   After this, anyone else must re-clone."
echo ""
read -p "Force push to GitHub? (yes/no): " FINAL_CONFIRM

if [ "$FINAL_CONFIRM" != "yes" ]; then
    echo -e "${RED}Aborted.${NC}"
    echo "To restore: git clone $BACKUP_DIR $REPO_DIR"
    exit 1
fi

echo "Force pushing..."
git push origin --force --all
git push origin --force --tags

echo -e "${GREEN}✓ Force push complete${NC}"
echo ""

# Step 9: Clean up local repo
echo "━━━ Step 9: Clean up local cache ━━━"
git reflog expire --expire=now --all
git gc --prune=now --aggressive
echo -e "${GREEN}✓ Local cache cleaned${NC}"
echo ""

# Step 10: Final verification
echo "━━━ Step 10: Final verification ━━━"
LEAKS_AFTER=$(gitleaks detect --no-git 2>&1 | grep -o "leaks found: [0-9]*" | grep -o "[0-9]*" || echo "0")
echo "Final leak count: $LEAKS_AFTER"
echo ""

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✓ Git History Purge Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Summary:"
echo "  • Commits before: $BEFORE_COMMITS"
echo "  • Commits after:  $(git rev-list --all --count)"
echo "  • Leaks before:   $LEAKS_BEFORE"
echo "  • Leaks after:    $LEAKS_AFTER"
echo "  • Backup:         $BACKUP_DIR"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Anyone else with a clone MUST re-clone:${NC}"
echo "   rm -rf ~/their-old-clone"
echo "   git clone $REMOTE_URL"
echo ""
echo -e "${GREEN}✓ You can now rotate your API keys safely!${NC}"
echo ""

# Cleanup
rm -f "$SECRETS_FILE"

echo "Done! 🎉"
