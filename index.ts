import express from 'express'
import { S3 } from 'aws-sdk'

const app = express()

app.get('/', async (_req, res, next) => {
  try {
    const s3 = new S3({apiVersion: '2006-03-01'})
    const buckets = await s3.listBuckets().promise()
    if(buckets.Buckets) {
      res.send('Buckets: ' + buckets.Buckets.map(x => x.Name).join(', '))
    } else {
      res.send('No buckets :(')
    }
  } catch(e) {
    next(e)
  }
})

app.listen(3000, () => console.log('Listening on 3000'))
