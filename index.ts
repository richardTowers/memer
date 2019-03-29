import express from 'express'
import { S3 } from 'aws-sdk'

const port = process.env['PORT'] || '3000'
const app = express()

app.get('/list-buckets', async (_req, res, next) => {
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

app.get('/healthcheck', (_req, res) => {
  res.send('OK')
})

app.get('/', (_req, res) => {
  res.send('Hello world')
})

app.listen(port, () => console.log(`Listening on ${port}`))
