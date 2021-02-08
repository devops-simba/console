#!/bin/sh

cd .output

mkdir -p pkg/graphql
cp schema.graphql pkg/graphql
./bridge \
    --base-address="http://localhost:9000"                                  \
    --listen="http://0.0.0.0:9000"                                          \
    --branding="simba"                                                      \
    --public-dir="./dist"                                                   \
    --k8s-auth="openshift"                                                  \
    --user-auth="openshift"                                                 \
    --k8s-mode="off-cluster"                                                \
    --user-auth-oidc-client-id="console-debug-client-oauth"                 \
    --user-auth-oidc-client-secret-file="../console-debug-client-secret"    \
    --k8s-mode-off-cluster-endpoint="`oc whoami --show-server`"             \
    --k8s-mode-off-cluster-alertmanager="`oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.alertmanagerPublicURL}'`" \
    --k8s-mode-off-cluster-thanos="`oc -n openshift-config-managed get configmap monitoring-shared-config -o jsonpath='{.data.thanosPublicURL}'`"
