#!/bin/sh

CUR_DIR=`realpath .`
MY_DIR=`realpath "$(dirname "$0")"`
cd "$MY_DIR"

session_id=`cat /proc/sys/kernel/random/uuid`

ROOT_DIR=`realpath "$MY_DIR/.."`
YARN_CACHE="/tmp/.yarn-cache"
BUILD_DIR="/tmp/console-$session_id"
OUTPUT_DIR="$MY_DIR/.output"
IMAGE_TAG="mehbos/openshift-console-modified:4.7"

mkdir -p $YARN_CACHE
mkdir -p "$BUILD_DIR"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
cp -r "$ROOT_DIR" $BUILD_DIR

# remove files that remained from local builds
find $BUILD_DIR -type d -name node_modules -exec rm -rf {} \;

CONSOLE_DIR=$BUILD_DIR/console
docker run -it --rm \
  -v "$YARN_CACHE:/usr/local/share/.cache" \
  -v "$CONSOLE_DIR:/go/src/github.com/devops-simba/console" \
  quay.io/coreos/tectonic-console-builder:v20 \
  /go/src/github.com/devops-simba/console/fast-build/init.sh && \
cp $CONSOLE_DIR/bin/bridge "$OUTPUT_DIR" && \
cp -r $CONSOLE_DIR/frontend/public/dist "$OUTPUT_DIR/dist" && \
cp $CONSOLE_DIR/pkg/graphql/schema.graphql "$OUTPUT_DIR" && \
docker build --rm -t "$IMAGE_TAG" -f "$MY_DIR/Dockerfile" "$OUTPUT_DIR"

rm -rf "$OUTPUT_DIR"
rm -rf $BUILD_DIR
exit 0

cd "$CUR_DIR"
