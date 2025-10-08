#!/bin/bash

# Build the project
npm run build

# Deploy to VPS
rsync -avz --delete dist/ root@72.60.203.162:/var/www/ashwheel.cloud/

echo "Deployment complete!"
