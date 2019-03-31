import express from 'express'
import multer from 'multer'
import serveStatic from 'serve-static'
import fs from 'fs'
import nunjucks from 'nunjucks'
import IStorage from './storage/interface'
import S3Storage from './storage/s3'
import passport from 'passport'
//@ts-ignore
import passportGoogleOauth from 'passport-google-oauth20'
import expressSession from 'express-session'

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
const googleClientId = process.env['GOOGLE_CLIENT_ID']
if (!googleClientId) {
  throw new Error('GOOGLE_CLIENT_ID must be set')
}
const googleClientSecret = process.env['GOOGLE_CLIENT_SECRET']
if (!googleClientSecret) {
  throw new Error('GOOGLE_CLIENT_SECRET must be set')
}
const sessionSecret = process.env['SESSION_SECRET']
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set')
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

passport.serializeUser(function(user: any, done) {
  done(null, user.emails[0].value);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.use(expressSession({ secret: sessionSecret, resave: true, saveUninitialized: true }))
app.use(passport.initialize())
app.use(passport.session())

app.use('/static', serveStatic('static'))
app.use('/assets', serveStatic('node_modules/govuk-frontend/assets'))

passport.use(new passportGoogleOauth.Strategy({
  clientID: googleClientId,
  clientSecret: googleClientSecret,
  callbackURL: '/auth/google/callback'
}, (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
  done(null, profile)
}))

app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'email'] }))

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/something-went-wrong' }), (_req, res) => {
  res.redirect('/select-your-image')
})

const imageUpload = multer({ dest: 'uploads/' }).single('imageUpload')

app.get('/login', (_req, res) => {
  res.render('login.njk')
})

app.post('/upload', imageUpload, async (req, res, next) => {
  try {
    const file = fs.readFileSync(__dirname + '/' + req.file.path)
    await s3Storage.writeFile(`${req.file.filename}-${req.file.originalname}`, file)
    res.redirect('/login')
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

app.get('/', async (req, res, next) => {
  try {
    const keys = await s3Storage.list()
    res.render('gallery.njk', { objects: keys, authenticatedUser: req.user })
  } catch(e) {
    next(e)
  }
})

app.get('/select-your-image', async (req, res, next) => {
  try {
    if (!req.user) { return res.redirect('/login') }
    const keys = await s3Storage.list()
    res.render('select-your-image.njk', { objects: keys, authenticatedUser: req.user })
  } catch(e) {
    next(e)
  }
})

app.get('/caption-your-image/:object', (req, res) => {
  if (!req.user) { return res.redirect('/login') }
  res.render('caption-your-image.njk', { object: req.params.object, authenticatedUser: req.user })
})

app.get('/gallery/:currentObject', async (req, res, next) => {
  try {
    const keys = await s3Storage.list()
    res.render('gallery.njk', { currentObject: req.params.currentObject, objects: keys, authenticatedUser: req.user })
  } catch(e) {
    next(e)
  }
})

app.listen(port, () => console.log(`Listening on ${port}`))
