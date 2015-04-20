
// Import all the stuffs!
var env     = process.env.NODE_ENV || 'development'

  // json
  , version = require(__dirname + '/package.json').version

  // Express
  , express = require('express')
  , app     = express()
  , server  = require('http').createServer(app)

  // middleware
  , compress     = require('compression')
  , favicon      = require('serve-favicon')
  , errorHandler = require('errorhandler')

  // our routes
  , router = require('./app/server/router')


console.log('version=' + version)


// setup our things
app.set('trust proxy', 1)
app.set('views', __dirname + '/app/server/views')
app.set('view engine', 'jade')
app.locals.pretty = true
app.use(compress())
app.use(favicon(__dirname + '/app/public/SB-Logo.ico'))


// Development-specific options.
if (env === 'development') {
  app.use(errorHandler({ dumpExceptions: true, showStack: true }))
}
// Production-environment-specific options.
else if (env === 'production') {
  app.use(function (req, res, next) {
    // HSTS
    res.setHeader('Strict-Transport-Security', 'max-age=8640000; includeSubDomains')

    // Redirect all traffic to https
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, 'https://' + req.host + (req.path || '/'))
    } else next()
  })
}


app.use(function(req, res, next) {
  res.header('X-Content-Type-Options', 'nosniff')
  res.header('X-Frame-Options', 'DENY')
  res.header('X-Geek-Status', 'You\'re awesome. p.s: Hedgehogs <3')
  next()
})

app.use('/s/', express.static(__dirname + '/app/public'))
app.use('/', express.static(__dirname + '/app/rootfiles'))

app.use(router())
server.listen(8080)


console.log('searchbeam.jit.su has successfully started')
