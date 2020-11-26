#!/bin/sh

CUR_DIR=`realpath .`
MY_DIR=`realpath "$(dirname "$0")"`
cd "$MY_DIR"

ROOT_DIR=`realpath "$MY_DIR/.."`
YARN_CACHE="$MY_DIR/.yarn-cache"

rm -rf $ROOT_DIR/bin

mkdir -p "$YARN_CACHE"

rm -rf "$MY_DIR/.output"
mkdir "$MY_DIR/.output"

docker run -it --rm \
    -v "$ROOT_DIR:/go/src/github.com/openshift/console/" \
    -v "$YARN_CACHE:/usr/local/share/.cache" \
    -v "$MY_DIR:/scripts" \
    quay.io/coreos/tectonic-console-builder:v20 \
    /scripts/init.sh

# copy created output to the .output directory
cp "$ROOT_DIR/bin/bridge" $MY_DIR/.output && \
cp -r "$ROOT_DIR/frontend/public/dist" $MY_DIR/.output && \
cp "$ROOT_DIR/pkg/graphql/schema.graphql" $MY_DIR/.output && \
docker build -f Dockerfile "$MY_DIR/.output"

cd "$CUR_DIR"