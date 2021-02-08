#!/usr/bin/env bash

set -e

pushd frontend
yarn install
yarn run dev-once --verbose
popd
