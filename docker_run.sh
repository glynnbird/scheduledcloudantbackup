#!/bin/bash

# run our Docker image, passing in environment variables to
# configure source database, destination COS service and
# service credentials
docker run \
  --env COUCH_URL="$COUCH_URL" \
  --env COS_ENDPOINT_URL="$COS_ENDPOINT_URL" \
  --env COS_BUCKET="$COS_BUCKET" \
  --env AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  --env AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  --env DEBUG=scheduledcloudantbackup \
  scheduledcloudantbackup