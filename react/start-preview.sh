#!/bin/bash
set -e
cd /home/user/syncfusion-application-factory/apps/ai-assisted-knowledge-workflow/frontend/react
exec node node_modules/vite/bin/vite.js preview --port 4173 --host 0.0.0.0
