#!/bin/sh

cd /go/src/github.com/devops-simba/console/
./frontend/packages/simba/fast-build/build_release.sh

ls -la frontend/public/dist
