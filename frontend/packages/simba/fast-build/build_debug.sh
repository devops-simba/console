#!/usr/bin/env bash

set -e

# Builds the server-side golang resources for tectonic-console. For a
# complete build, you must also run build-frontend

# Use deps from vendor dir.
export GOFLAGS="-mod=vendor"

GIT_TAG=${SOURCE_GIT_TAG:-$(git describe --always --tags HEAD)}
LD_FLAGS="-n -X github.com/devops-simba/console/pkg/version.Version=${GIT_TAG}"

go build -ldflags "${LD_FLAGS}" -o bin/bridge github.com/devops-simba/console/cmd/bridge

pushd frontend
yarn install
echo "running 'yarn run dev-once'"
yarn run dev-once #--verbose
popd
