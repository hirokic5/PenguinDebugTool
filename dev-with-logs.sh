#!/bin/bash
# Run Vite with error logging to file
npm run dev 2>&1 | tee vite-errors.log