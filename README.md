# scheduledcloudantbackup

This is a proof-of-concept backup solution of Cloudant databases. It consists of Node.js app which when invoked backs up a single Cloudant database to IBM Cloud Object storage. It can be run on your machine, as a Docker container or scheduled to run periodically in a Kubernetes service.

## Configuration

The script knows which Cloudant database, Object Storage bucket and credentials to use from environment variables:

- `COUCH_URL` - the full URL (including credentials and database name) to back up e.g. "https://myusername:mypassword@mycloudant.cloudant.com/mydb"
- `COS_ENDPOINT_URL` - the URL of the IBM Cloud Object storage [endpoint](https://cloud.ibm.com/docs/services/cloud-object-storage/basics?topic=cloud-object-storage-endpoints) to connect to e.g. "https://s3.eu-gb.cloud-object-storage.appdomain.cloud/"
- `COS_BUCKET` - the name of the bucket to write to  e.g. "gbcloudantbackup"
- `AWS_ACCESS_KEY_ID`  - the [HMAC](https://cloud.ibm.com/docs/services/cloud-object-storage/hmac/credentials.html) access key id for your Object Storage service
- `AWS_SECRET_ACCESS_KEY` - the HMAC secret access key for your Object Storage service. 

## Running locally

Clone the repo:

```sh
git clone https://github.com/glynnbird/scheduledcloudantbackup.git
cd scheduledcloudantbackup
```

Install the dependencies:

```sh
npm install
```

Run:

```sh
node backup
```

## Running as a Docker container

Build the Docker container:

```sh
docker build -t scheduledcloudantbackup .
```

Run:

```sh
docker run \
  --env COUCH_URL="$COUCH_URL" \
  --env COS_ENDPOINT_URL="$COS_ENDPOINT_URL" \
  --env COS_BUCKET="$COS_BUCKET" \
  --env AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  --env AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  --env DEBUG=scheduledcloudantbackup \
  scheduledcloudantbackup
```
