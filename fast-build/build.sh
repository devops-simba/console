!/bin/sh

SCRIPT_DIR=`realpath "$(dirname "$0")"`
APP_DIR=`realpath "$SCRIPT_DIR/.."`

build_application() {
  YARN_CACHE="/tmp/.yarn-cache"
  OUTPUT_DIR="$SCRIPT_DIR/.output"
  IMAGE_NAME="registry.apps.internal.ic.cloud.snapp.ir/openshift-console/openshift-console-modified"
  IMAGE_TAG="4.8.9"

  app_location="$1"
  mkdir -p "$OUTPUT_DIR"
  docker run -it --rm \
      -v "$1:/go/src/github.com/devops-simba/console" \
      -v "$YARN_CACHE:/usr/local/share/.cache" \
      quay.io/coreos/tectonic-console-builder:v20 \
      /go/src/github.com/devops-simba/console/fast-build/init.sh && \
  cp -r "$1/bin/bridge" "$OUTPUT_DIR" && \
  cp -r "$1/frontend/public/dist" "$OUTPUT_DIR" && \
  cp "$1/pkg/graphql/schema.graphql" "$OUTPUT_DIR" && \
  docker build --rm -t "$IMAGE_NAME:$IMAGE_TAG" -f "$SCRIPT_DIR/Dockerfile" "$OUTPUT_DIR"
  RESULT=$?
  rm -rf "$OUTPUT_DIR"
  return $RESULT
}

USERNAME="$1"
case "$2" in
  out|out-of-place)
    BUILD_LOCATION="/tmp/console-`cat /proc/sys/kernel/random/uuid`"

    echo "out of place build(copy solution and build somewhere else)"
    # remove old node_modules in place, so we create new ones
    find "$BUILD_LOCATION" -type d -name node_modules -exec rm -rf {} +
    cp -r "$APP_DIR" "$BUILD_LOCATION"
    build_application "$BUILD_LOCATION"
    RESULT=$?
    rm -rf "$BUILD_LOCATION"
  ;;

  *)
    echo "in place build(build inside the solution, will create some data in the solution)"
    build_application "$APP_DIR"
    RESULT=$?
  ;;
esac

if [ $RESULT -eq 0 ]; then
  echo "Pushing image to image registry"
  docker login "registry.apps.internal.ic.cloud.snapp.ir" -u "${USERNAME:-mohammadmahdi.roozitalab}" -p `oc whoami -t`
  docker push "$IMAGE_NAME:$IMAGE_TAG"
else
  echo "Failed to build frontend, exit code is $RESULT"
fi
