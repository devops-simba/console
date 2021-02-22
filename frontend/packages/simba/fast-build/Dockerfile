FROM openshift/origin-base

COPY ./dist /opt/bridge/static
COPY ./bridge /opt/bridge/bin/bridge
COPY ./schema.graphql /pkg/graphql/schema.graphql

LABEL io.k8s.display-name="OpenShift Console" \
      io.k8s.description="This is a component of OpenShift Container Platform and provides a web console." \
      io.openshift.tags="openshift" \
      maintainer="Samuel Padgett <spadgett@redhat.com>"

# doesn't require a root user.
USER 1001

CMD [ "/opt/bridge/bin/bridge", "--public-dir=/opt/bridge/static" ]
