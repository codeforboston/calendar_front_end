#!/bin/sh
./node_modules/gulp/bin/gulp.js build
git subtree push --prefix dist origin gh-pages
