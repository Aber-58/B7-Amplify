#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$SCRIPT_DIR/../state"
docker run --rm -it -p 4200:4200 -v "$SCRIPT_DIR/../state":/state amplify:latest
