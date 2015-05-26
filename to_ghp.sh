#!/bin/sh
gulp build
git subtree push --prefix dist origin gh-pages
