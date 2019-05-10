
const stream = require('stream')
const url = require('url')
const AWS = require('aws-sdk')
const couchbackup = require('@cloudant/couchbackup')
const debug = require('debug')('scheduledcloudantbackup')

/*
  Main function, run from base of file.
*/
const main = async () => {
  const sourceUrl = process.env.COUCH_URL
  const backupName = new url.URL(sourceUrl).pathname.split('/').filter(function (x) { return x }).join('-')
  const backupBucket = process.env.COS_BUCKET
  const backupKey = `${backupName}-${new Date().toISOString()}`
  const s3Endpoint = process.env.COS_ENDPOINT_URL

  // Creds are from ~/.aws/credentials, environment etc. (see S3 docs).
  const awsOpts = {
    signatureVersion: 'v4',
    endpoint: new AWS.Endpoint(s3Endpoint)
  }
  const s3 = new AWS.S3(awsOpts)

  // do the backup
  debug(`Creating a new backup of ${s(sourceUrl)} at ${backupBucket}/${backupKey}...`)
  try {
    const accessible = await bucketAccessible(s3, backupBucket)
    if (accessible) {
      await backupToS3(sourceUrl, s3, backupBucket, backupKey, false)
      debug('done.')
    }
  } catch (error) {
    debug(`Error: ${error}`)
    process.exit(1)
  }
}

/**
 * Return a promise that resolves if the bucket is available and
 * rejects if not.
 *
 * @param {any} s3 S3 client object
 * @param {any} bucketName Bucket name
 * @returns Promise
 */
const bucketAccessible = async (s3, bucketName) => {
  var params = {
    Bucket: bucketName
  }
  const i = s3.headBucket(params).promise()
  return i
}

/**
 * Backup directly from Cloudant to an object store object via a stream.
 *
 * @param {any} sourceUrl URL of database
 * @param {any} s3Client Object store client
 * @param {any} s3Bucket Backup destination bucket
 * @param {any} s3Key Backup destination key name (shouldn't exist)
 * @param {any} shallow Whether to use the couchbackup `shallow` mode
 * @returns Promise
 */
const backupToS3 = async (sourceUrl, s3Client, s3Bucket, s3Key, shallow) => {
  return new Promise((resolve, reject) => {
    debug(`Setting up S3 upload to ${s3Bucket}/${s3Key}`)

    // A pass through stream that has couchbackup's output
    // written to it and it then read by the S3 upload client.
    // It has a 64MB highwater mark to allow for fairly
    // uneven network connectivity.
    const streamToUpload = new stream.PassThrough({ highWaterMark: 67108864 })

    // Set up S3 upload.
    const params = {
      Bucket: s3Bucket,
      Key: s3Key,
      Body: streamToUpload
    }
    s3Client.upload(params, function (err, data) {
      debug('Object store upload done')
      if (err) {
        debug(err)
        reject(new Error('Object store upload failed'))
        return
      }
      debug('Object store upload succeeded')
      debug(data)
      resolve()
    }).httpUploadProgress = (progress) => {
      debug(`Object store upload progress: ${progress}`)
    }

    debug(`Starting streaming data from ${s(sourceUrl)}`)
    couchbackup.backup(
      sourceUrl,
      streamToUpload,
      (err, obj) => {
        if (err) {
          debug(err)
          reject(new Error(err, 'CouchBackup failed with an error'))
          return
        }
        debug(`Download from ${s(sourceUrl)} complete.`)
        streamToUpload.end() // must call end() to complete upload.
        // resolve() is called by the upload
      }
    ).on('written', (batch) => {
      process.stdout.write(`  ${batch.total} docs\r`)
    })
  })
}

/**
 * Remove creds from a URL, e.g., before logging
 *
 * @param {string} url URL to safen
 */
const s = (originalUrl) => {
  var parts = new url.URL(originalUrl)
  return url.format(parts, { auth: false })
}

main()
