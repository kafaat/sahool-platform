#!/bin/bash
# استخراج السكريبت من DEPLOYMENT_PACKAGE.md
sed -n '/^```bash$/,/^```$/p' DEPLOYMENT_PACKAGE.md | grep -v '```' > /tmp/install_extracted.sh
chmod +x /tmp/install_extracted.sh
