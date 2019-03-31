import express from 'express'
import multer from 'multer'
import serveStatic from 'serve-static'
import fs from 'fs'
import nunjucks from 'nunjucks'
import IStorage from './storage/interface'
import S3Storage from './storage/s3'

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
const s3Storage: IStorage = new S3Storage(credentials)

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
    await s3Storage.writeFile(`${req.file.filename}-${req.file.originalname}`, file)
    res.redirect('/')
  } catch(e) {
    next(e)
  }
})

app.get('/images/:key', (req, res) => {
  s3Storage.readFile(req.params.key).pipe(res)
})

app.get('/healthcheck', (_req, res) => {
  res.send('OK')
})

app.get('/', async (_req, res, next) => {
  try {
    const keys = await s3Storage.list()
    res.render('gallery.njk', { objects: keys })
  } catch(e) {
    next(e)
  }
})

app.get('/select-your-image', async (_req, res, next) => {
  try {
    const keys = await s3Storage.list()
    res.render('select-your-image.njk', { objects: keys })
  } catch(e) {
    next(e)
  }
})

app.get('/caption-your-image/:object', (req, res) => {
  res.render('caption-your-image.njk', { object: req.params.object })
})

app.get('/gallery/:currentObject', async (req, res, next) => {
  try {
    const keys = await s3Storage.list()
    res.render('gallery.njk', { currentObject: req.params.currentObject, objects: keys })
  } catch(e) {
    next(e)
  }
})

app.listen(port, () => console.log(`Listening on ${port}`))
