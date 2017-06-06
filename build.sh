#!/usr/bin/env sh

./node_modules/.bin/webpack ./src/index.js ./dist/bundle.js && \
cp ./src/index.html ./dist/index.html
