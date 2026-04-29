#!/bin/bash
set -e

echo "[post-merge] installing server dependencies..."
npm --prefix server install --legacy-peer-deps

echo "[post-merge] installing client dependencies..."
npm --prefix client install --legacy-peer-deps

echo "[post-merge] done."
