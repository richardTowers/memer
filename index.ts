import express from 'express'
import multer from 'multer'
import serveStatic from 'serve-static'
import { S3 } from 'aws-sdk'
import fs from 'fs'
import nunjucks from 'nunjucks'

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
const { bucket_name: bucketName } = credentials
const s3 = new S3({
  accessKeyId: credentials.aws_access_key_id,
  secretAccessKey: credentials.aws_secret_access_key,
  region: credentials.aws_region,
  apiVersion: '2006-03-01'
})

const app = express()

nunjucks.configure([
    'views',
    "node_modules/govuk-frontend/",
    'node_modules/govuk-frontend/components/',
  ], {
  autoescape: true,
  express: app
});

app.use('/static', serveStatic('static'))
app.use('/assets', serveStatic('node_modules/govuk-frontend/assets'))

const imageUpload = multer({ dest: 'uploads/' }).single('imageUpload')

app.post('/upload', imageUpload, async (req, res, next) => {
  try {
    const file = fs.readFileSync(__dirname + '/' + req.file.path)
    await s3.upload({Bucket: bucketName, Key: `${req.file.filename}-${req.file.originalname}`, Body: file}).promise()
    res.redirect('/')
  } catch(e) {
    next(e)
  }
})

app.get('/images/:key', (req, res) => {
  s3.getObject({Bucket: bucketName, Key: req.params.key}).createReadStream().pipe(res)
})

app.get('/healthcheck', (_req, res) => {
  res.send('OK')
})

app.get('/', async (_req, res, next) => {
  try {
    const objects = await s3.listObjects({Bucket: bucketName }).promise()
    if(objects.Contents) {
      res.render('gallery.njk', { objects: objects.Contents.map(x => x.Key) })
    } else {
      res.render('gallery.njk')
    }
  } catch(e) {
    next(e)
  }
})

app.get('/select-your-image', async (_req, res, next) => {
  try {
    const objects = await s3.listObjects({Bucket: bucketName }).promise()
    if(objects.Contents) {
      res.render('select-your-image.njk', { objects: objects.Contents.map(x => x.Key) })
    } else {
      res.render('select-your-image.njk')
    }
  } catch(e) {
    next(e)
  }
})

app.get('/caption-your-image/:object', (req, res) => {
  res.render('caption-your-image.njk', { object: req.params.object })
})

app.get('/gallery/:currentObject', async (req, res, next) => {
  try {
    const objects = await s3.listObjects({Bucket: bucketName }).promise()
    if(objects.Contents) {
      res.render('gallery.njk', { currentObject: req.params.currentObject, objects: objects.Contents.map(x => x.Key) })
    } else {
      res.render('gallery.njk')
    }
  } catch(e) {
    next(e)
  }
})

app.listen(port, () => console.log(`Listening on ${port}`))
