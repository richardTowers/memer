import express from 'express'
import { S3 } from 'aws-sdk'

const port = process.env['PORT'] || '3000'

const vcapServicesRaw = process.env['VCAP_SERVICES']
if (!vcapServicesRaw) {
  throw new Error('VCAP_SERVICES must be set')
}
const vcapServices = JSON.parse(vcapServicesRaw)
const credentials = (vcapServices['aws-s3-bucket'] || [{}])[0]['credentials']
if (!credentials) {
  throw new Error('VCAP_SERVICES must contain aws-s3-bucket[0].credentials, found ' + Object.keys(vcapServices))
}
const { aws_access_key_id: accessKeyId, aws_secret_access_key: secretAccessKey, aws_region: region, bucket_name: bucketName } = credentials

const app = express()

app.get('/list-objects', async (_req, res, next) => {
  try {
    const s3 = new S3({accessKeyId, secretAccessKey, region, apiVersion: '2006-03-01'})
    const objects = await s3.listObjects({Bucket: bucketName }).promise()
    if(objects.Contents) {
      res.send('Objects: ' + JSON.stringify(objects.Contents.map(x => x.Key)))
    } else {
      res.send('No objects :(')
    }
  } catch(e) {
    next(e)
  }
})

app.get('/healthcheck', (_req, res) => {
  res.send('OK')
})

app.get('/', (_req, res) => {
  res.send('Hello world')
})

app.listen(port, () => console.log(`Listening on ${port}`))
