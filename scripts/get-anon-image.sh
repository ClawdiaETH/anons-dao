#!/bin/bash
# Get Anon image as PNG from tokenURI
# Usage: ./get-anon-image.sh <token_id> <output_file.png>

set -e

TOKEN_ID=$1
OUTPUT_FILE=$2

if [ -z "$TOKEN_ID" ] || [ -z "$OUTPUT_FILE" ]; then
  echo "Usage: $0 <token_id> <output_file.png>"
  exit 1
fi

# Get tokenURI
TOKEN_URI=$(cast call 0x1ad890FCE6cB865737A3411E7d04f1F5668b0686 "tokenURI(uint256)(string)" $TOKEN_ID --rpc-url https://mainnet.base.org)

# Remove surrounding quotes
TOKEN_URI=$(echo "$TOKEN_URI" | tr -d '"')

# Extract base64 SVG from JSON (tokenURI is data:application/json;base64,...)
JSON_BASE64=$(echo "$TOKEN_URI" | sed 's/data:application\/json;base64,//')
JSON=$(echo "$JSON_BASE64" | base64 -d)

# Extract image data (data:image/svg+xml;base64,...)
SVG_DATA=$(echo "$JSON" | jq -r '.image')
SVG_BASE64=$(echo "$SVG_DATA" | sed 's/data:image\/svg\+xml;base64,//')

# Decode SVG
echo "$SVG_BASE64" | base64 -d > /tmp/anon-$TOKEN_ID.svg

# Convert to PNG using ImageMagick or rsvg-convert
if command -v rsvg-convert &> /dev/null; then
  rsvg-convert /tmp/anon-$TOKEN_ID.svg -o "$OUTPUT_FILE" -w 800 -h 800
elif command -v convert &> /dev/null; then
  convert /tmp/anon-$TOKEN_ID.svg -resize 800x800 "$OUTPUT_FILE"
else
  echo "Error: Need rsvg-convert or ImageMagick convert"
  exit 1
fi

echo "Saved Anon #$TOKEN_ID to $OUTPUT_FILE"
