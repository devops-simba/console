#!/bin/sh

SCRIPT_DIR=`realpath "$(dirname "$0")"`
APP_DIR=`realpath "$SCRIPT_DIR/.."`

red="\033[31m"
orange="\033[0;33m"
lightGray="\033[0;37m"
nc="\033[0m"

DEFAULT_REGISTRY='registry.apps.internal.ic.cloud.snapp.ir'
DEFAULT_IMAGE_NAME="$DEFAULT_REGISTRY/openshift-console/openshift-console-modified"
DEFAULT_OUTPUT="$SCRIPT_DIR/.output"

IMAGE_TAG='4.8.15'
IMAGE_NAME="$DEFAULT_IMAGE_NAME"
BUILD_TYPE=
BUILD_MODE=
OUTPUT_DIR="$DEFAULT_OUTPUT"
YARN_CACHE='/tmp/.yarn-cache'
PUSH_IMAGE='yes'
USERNAME=
PASSWORD=''
USER_TYPE='DEF'     # it may be 'DEF': default, 'USER': user set value, 'IN': read value from stdin
PASSWORD_TYPE='DEF' # it may be 'DEF': default, 'USER': user set value, 'IN': read value from stdin
VERBOSITY=0

usage() {
  echo "Usage: $0 <options>"
  echo "options:"
  echo "  [-h, --help]"
  echo "    Show this help window"
  echo "  [-b, --build-type]    <build-type>"
  echo "    Type of the build, valid values are:"
  echo "      dbg|debug"
  echo "        It will build a debug version of the program"
  echo "      rel|release|production"
  echo "        It will build a release version of the program"
  echo "        This is program"
  echo "  [-m, --build-mode]    <build-mode>"
  echo "    Model of the build valid values are:"
  echo "      none"
  echo "        do not build the image and just proceed with the pushing step"
  echo "      local"
  echo "        do not use docker and like of that and build the application locally."
  echo "        ${red}NOTE${nc}: Build tools must installed locally"
  echo "        ${red}NOTE${nc}: This build is always inline to the project source"
  echo "      in|inline|in-source"
  echo "        build the project using docker inside the source code"
  echo "        This is ${red}DEFAULT${nc} value for this option"
  echo "      out|out-of-source"
  echo "        it is just like 'in-source' but keep build data outside your solution to keep"
  echo "        your source code directory clean"
  echo "  [-i, --image]         <image-name>"
  echo "    If this is a docker build, then this flag indicate name of the created image"
  echo "  [-t, --tag]           <image-tag>"
  echo "    If this is a docker build, then this flag indicate tag of the created image"
  echo "  [-o, --output]        </path/to/location/that/we/should/put/output>"
  echo "    Local that we should push the output"
  echo "    DEFAULT value is ${red}${DEFAULT_OUTPUT}${nc}"
  echo "  [--yarn-cache]        </path/to/local/yarn/cache/directory>"
  echo "    Local location for yarn to cache its data, this is specially useful with docker"
  echo "    builds, so we may speed up the build"
  echo "  [-p, --push]          <yes|no>"
  echo "    If this is a docker build, then this flag indicate whether we should push image"
  echo "    to a remote registry or not"
  echo "    DEFAULT value is ${red}yes${nc}"
  echo "  [-u, --user]          <username>"
  echo "    If this is a docker build and we should push created image, this is the username that"
  echo "    we should use to authorize with image registry."
  echo "    DEFAULT value is the value returned from 'oc whoami'."
  echo "    ${red}NOTE${nc}: If you want to ommit automatic authorization before pushing, pass"
  echo "    an empty string as this value"
  echo "  [-P, --password]      <password>"
  echo "    Password for authetication with the image registry"
  echo "    DEFAULT value is the token that will be returned from 'oc whoami -t'"
  echo "  [--password-in-stdin]"
  echo "    Read image registry authentication password from stdin"
  echo "  [-v, --verbose]       <verbosity>"
  echo "    Set verbosity of this script"

  if [ -z "$1" ]; then
    exit 0
  else
    exit $1
  fi
}
log() {
  level="$1"
  message="$2"
  if [ $VERBOSITY -ge $level ]; then
    echo "$message"
  fi
}
set_build_type() {
  case "$1" in
    debug|dbg)              BUILD_TYPE='debug'   ;;
    rel|release|production) BUILD_TYPE='release' ;;
    *)
      echo "${red}Invalid build type${nc}"
      usage 1
    ;;
  esac
}
set_build_mode() {
  case "$1" in
    none)                BUILD_MODE='none';;
    local)               BUILD_MODE='local';;
    in|inline|in-source) BUILD_MODE='in-source';;
    out|out-of-source)   BUILD_MODE='out-source';;
    *)
      echo "${red}Invalid build mode${nc}"
      usage 2
    ;;
  esac
}
set_push() {
  case `echo "$1" | tr '[:upper:]' '[:lower:]'` in
    yes|y|t|true|1) PUSH_IMAGE='yes' ;;
    *)              PUSH_IMAGE='no'  ;;
  esac
}

# initialize default values for arguments
set_build_type "release"
set_build_mode "inline"

PARSED_ARGS=`getopt -n "$0" -o 'hb:m:i:t:o:p:y:P:v:' --long 'help,build-type:,build-mode:,image:,tag:,output:,push:,user:,password:,password-in-stdin,yarn-cache:,verbosity' -- $@`

while :
do
  case "$1" in
    -h|--help) usage ;;
    -m|--build-mode)      set_build_mode "$2";                  shift 2 ;;
    -b|--build-type)      set_build_type "$2";                  shift 2 ;;
    -i|--image)           IMAGE_NAME="$2";                      shift 2 ;;
    -t|--tag)             IMAGE_TAG="$2";                       shift 2 ;;
    -o|--output)          OUTPUT_DIR="$2";                      shift 2 ;;
    --yarn-cache)         YARN_CACHE="$2";                      shift 2 ;;
    -p|--push)            set_push "$2";                        shift 2 ;;
    -u|--user)            USERNAME="$2"; USER_TYPE="USER";      shift 2 ;;
    -p|--password)        PASSWORD="$2"; PASSWORD_TYPE="USER";  shift 2 ;;
    --password-in-stdin)  PASSWORD_TYPE="IN";                   shift 1 ;;
    -v|--verbosity)       VERBOSITY=$2;                         shift 2 ;;
    *) break ;;
  esac
done

local_build() {
  log 1 "Building locally($BUILD_TYPE)"
  cd "$APP_DIR"
  case $BUILD_TYPE in
    debug)   ./build-debug.sh ;;
    release) ./build.sh       ;;
  esac
  RESULT=$?
  if [ $RESULT -eq 0 ]; then
    log 1 "Copying built assets to output directory($OUTPUT_DIR)"
    mkdir -p "$OUTPUT_DIR"
    cp -r "$APP_DIR/bin/bridge" "$OUTPUT_DIR" && \
    cp -r "$APP_DIR/frontend/public/dist" "$OUTPUT_DIR" && \
    cp "$APP_DIR/pkg/graphql/schema.graphql" "$OUTPUT_DIR"
    RESULT=$?
  fi
  return $RESULT
}
docker_build() {
  log 1 "Building in docker($BUILD_TYPE)"
  app_location="$1"
  case $BUILD_TYPE in
    debug) BUILDER=init-dev.sh ;;
    *)     BUILDER=init.sh     ;;
  esac
  mkdir -p "$OUTPUT_DIR"
  mkdir -p "$YARN_CACHE"
  docker run -it --rm \
      -v "$1:/go/src/github.com/devops-simba/console" \
      -v "$YARN_CACHE:/usr/local/share/.cache"        \
      quay.io/coreos/tectonic-console-builder:v20     \
      /go/src/github.com/devops-simba/console/fast-build/$BUILDER
  RESULT=$?
  if [ $RESULT -eq 0 ]; then
    log 1 "Copying built assets to output directory"
    cp -r "$1/bin/bridge" "$OUTPUT_DIR" &&              \
    cp -r "$1/frontend/public/dist" "$OUTPUT_DIR" &&    \
    cp "$1/pkg/graphql/schema.graphql" "$OUTPUT_DIR"

    log 1 "Building docker image from assets"
    docker build --rm -t "$IMAGE_NAME:$IMAGE_TAG" -f "$SCRIPT_DIR/Dockerfile" "$OUTPUT_DIR"
    RESULT=$?
  fi
  rm -rf "$OUTPUT_DIR"
  return $RESULT
}
oc_read_username() {
  USERNAME=`oc whoami`
  RESULT=$?
  if [ $RESULT -ne 0 ]; then
    echo "${red}Error in getting your username from oc. Are you logged in?${nc}"
  fi
  return $RESULT
}
oc_read_password() {
  # second call does not always fail if user is not logged in
  PASSWORD=`oc whoami > /dev/null 2>&1 && oc whoami -t`
  RESULT=$?
  if [ $RESULT -ne 0 ]; then
    echo "${red}Error in getting your password from oc. Are you logged in?${nc}"
  fi
  return $RESULT
}
docker_authenticate() {
  REGISTRY=`echo "$IMAGE_NAME" | awk 'BEGIN {FS="/"}{print $1}' | head`
  if [ "$USER_TYPE" = "DEF" ]
  then
    if [ "$REGISTRY" = "$DEFAULT_REGISTRY" ]; then
      oc_read_username
      if [ $? -ne 0 ]; then return $?; fi
    else
      echo "${orange}Can't get default username as registry is unknown($REGISTRY)${nc}:"
      echo "Please enter you registry username(empty if it is ok to proceed with 'oc whoami'): "
      read USERNAME
      if [ -z "$USERNAME" ]; then
        oc_read_username
        if [ $? -ne 0 ]; then return $?; fi
      fi
    fi

    if [ -z "$USERNAME" ]; then
      echo "${red}Failed to read username from oc${nc}"
      return 1
    fi
  fi

  if [ -z "$USERNAME" ]; then return 0; fi

  # authentication
  case "$PASSWORD_TYPE" in
    DEF)
      if [ "$REGISTRY" = "$DEFAULT_REGISTRY" ]; then
        oc_read_password
        if [ $? -ne 0 ]; then return $?; fi
      else
        echo "${orange}Can't get default password as registry is unknown${nc}:"
        echo "Please enter you password(empty if it is ok to proceed with 'oc whoami -t'): "
        read -s PASSWORD
        if [ -z "$PASSWORD" ]; then
          oc_read_password
          if [ $? -ne 0 ]; then return $?; fi
        fi
      fi
    ;;
    IN) read -s PASSWORD ;;
  esac

  log 1 "Authenticating with image registry(REGISTRY=$REGISTRY, USERNAME=$USERNAME)"
  REP=`docker login "$REGISTRY" -u "$USERNAME" -p "$PASSWORD"`
  RESULT=$?
  if [ $RESULT -ne 0 ]; then
    echo "${red}failed to login to registry${nc}\n  $REP\n";
    return $RESULT
  fi

  return 0
}
docker_push() {
  if [ "$PUSH_IMAGE" = "no" ]; then
    return 0
  fi

  docker_authenticate
  if [ $? -ne 0 ]; then return $?; fi

  echo "Pushing image to image registry($IMAGE_NAME:$IMAGE_TAG)"
  docker push "$IMAGE_NAME:$IMAGE_TAG"
  return $?
}

case "$BUILD_MODE" in
  local)
    echo "building application locally"
    local_build
    RESULT=$?
    PUSH_IMAGE='no'
  ;;
  none)
    RESULT=0
  ;;
  in-source)
    echo "in place build(build inside the solution, will create some data in the solution)"
    docker_build "$APP_DIR"
    RESULT=$?
  ;;
  out-source)
    BUILD_LOCATION="/tmp/console-`cat /proc/sys/kernel/random/uuid`"
    echo "out of place build(copy solution and build somewhere else)"
    # remove old node_modules in place, so we create new ones
    find "$BUILD_LOCATION" -type d -name node_modules -exec rm -rf {} +
    cp -r "$APP_DIR" "$BUILD_LOCATION"
    docker_build "$BUILD_LOCATION"
    RESULT=$?
    rm -rf "$BUILD_LOCATION"
  ;;
esac

if [ $RESULT -eq 0 ]; then
  docker_push
  RESULT=$?
fi

return $RESULT
