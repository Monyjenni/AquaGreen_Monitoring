#!/bin/bash
# Install Vue CLI globally for Vercel build
npm install -g @vue/cli-service @vue/cli
# Install dependencies
npm install
# Build the project
npm run build
