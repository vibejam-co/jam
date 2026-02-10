#!/usr/bin/env zsh
set -euo pipefail

ENV_FILE="/Users/Ira/Desktop/Vibe Jam/vibejam---midnight-zenith/.env.codex.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

read -s "SUPABASE_ACCESS_TOKEN?Enter SUPABASE_ACCESS_TOKEN (sbp_...): "
echo
read -s "SUPABASE_SERVICE_ROLE_KEY?Enter SUPABASE_SERVICE_ROLE_KEY (sb_secret_...): "
echo
read -s "SUPABASE_DB_PASSWORD?Enter SUPABASE_DB_PASSWORD (or leave blank): "
echo
read -s "SUPABASE_DB_URL?Enter SUPABASE_DB_URL (or leave blank): "
echo

if [[ -z "$SUPABASE_ACCESS_TOKEN" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
  echo "SUPABASE_ACCESS_TOKEN and SUPABASE_SERVICE_ROLE_KEY are required."
  exit 1
fi

if [[ -n "$SUPABASE_DB_PASSWORD" && -n "$SUPABASE_DB_URL" ]]; then
  echo "Use either SUPABASE_DB_PASSWORD or SUPABASE_DB_URL, not both."
  exit 1
fi

replace_or_add() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

replace_or_add "SUPABASE_ACCESS_TOKEN" "$SUPABASE_ACCESS_TOKEN"
replace_or_add "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
replace_or_add "SUPABASE_DB_PASSWORD" "$SUPABASE_DB_PASSWORD"
replace_or_add "SUPABASE_DB_URL" "$SUPABASE_DB_URL"

unset SUPABASE_ACCESS_TOKEN SUPABASE_SERVICE_ROLE_KEY SUPABASE_DB_PASSWORD SUPABASE_DB_URL

echo "Secrets saved to $ENV_FILE"
