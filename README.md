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
npm run start
```

## Running as a Docker container

Build the Docker container:

```sh
docker build -t scheduledcloudantbackup .
```

Run (assuming you have environment variables set):

```sh
docker run \
  --env COUCH_URL="$COUCH_URL" \
  --env COS_ENDPOINT_URL="$COS_ENDPOINT_URL" \
  --env COS_BUCKET="$COS_BUCKET" \
  --env AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  --env AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  scheduledcloudantbackup
```

## Running in Kubernetes

1. Sign up for a [IBM Kubernetes](https://www.ibm.com/uk-en/cloud/container-service) service.
2. Follow the instruction on how to install the `ibmcloud` command-line tools.
3. Authenticate. e.g. `ibmcloud login`
4. Set the Kubernetes target. e.g. `ibmcloud ks region-set eu-gb`
5. Download the cluster config e.g. `ibmcloud ks cluster-config scheduledcloudantbackup`
6. Log into the container registory service e.g. `ibmcloud cr login`
7. Create a namespace e.g. `ibmcloud cr namespace-add scheduledbackup`
8. Build an image e.g. `ibmcloud cr build -t uk.icr.io/scheduledbackup/backup:1 .`

So we now have an image called `uk.icr.io/scheduledbackup/backup:1` in the IBM image registry - we next need to trigger it to run periodically with a [Kubernetes cron job](https://kubernetes.io/docs/tasks/job/automated-tasks-with-cron-jobs/).

## Kubernetes cron job

A "cron job" is a term taken from the Unix world - it means running a task periodically, say every hour. It has a syntax specifying the interval at which your code is to be run, in our case we want [0 * * * *](https://crontab.guru/#0_*_*_*_*) which means "at the top of every hour".

Our cron job definition resides in a "cronjob.yml" file which tells the Kubernetes cluster which image to spin up, at what time and the environment variables it runs with. **Edit the `cronjob.yml` to configure your Cloudant service and Object Storage details before running**:

```sh
kubectl create -f cronjob.yml
```

Now wait until the top of the hour.