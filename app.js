
// Import all the stuffs!
var env     = process.env.NODE_ENV || 'development'

  // json
  , keys    = require(__dirname + '/keys.json')
  , version = require(__dirname + '/package.json').version

  // Express
  , express = require('express')
  , app     = express()
  , server  = require('http').createServer(app)

  // middleware
  , compress       = require('compression')
  , favicon        = require('static-favicon')
  , bodyParser     = require('body-parser')
  , cookieParser   = require('cookie-parser')
  , cookieSession  = require('cookie-session')
  , errorHandler   = require('errorhandler')
  , passport       = require('passport')
  , mongoose       = require('mongoose')
  , passportLocalMongoose = require('passport-local-mongoose')

  // options
  , session_opts = {
      secret: keys.express.session
    }

  // other vars
  , db
  , userKeyMap = {}

console.log('APP VERSION = ' + version)

// Use all the settings! (Mostly.)
app.set('port', 8080)
app.set('views', __dirname + '/app/server/views')
app.set('view engine', 'jade')
app.locals.pretty = true

// Use all the middlewares!
app.use(compress())
app.use(favicon(__dirname + '/app/public/SB-Logo.ico'))
app.use(bodyParser())
app.use(cookieParser(keys.express.cookies))
app.use(cookieSession({
    keys        : keys.express.session
  , signed      : true
  , secureProxy : env === 'production'
  , httpOnly    : true
  , maxAge      : 1000 * 60 * 60 * 4 // 4 hours
}))
app.use(passport.initialize())
app.use(passport.session())

// Connect to auth
db = mongoose.createConnection(keys.passport.database, {
  db: {
    native_parser: true
  },
  server: {
    poolSize: 5,
    auto_reconnect: true
  }
})
db.on('error', function(err) {
  console.log(err.stack)
})


setInterval(cleanKeyMap, 10000)

function cleanKeyMap() {
  for (key in userKeyMap) {
    if (Date.now() - userKeyMap[key].time > 20000)
      delete userKeyMap[key]
  }
}


function finalAndOpen() {
  app.use(function(req, res, next) {
    res.header('X-Content-Type-Options', 'nosniff')
    res.header('X-Frame-Options', 'DENY')
    //res.header('Content-Security-Policy',
    //  "default-src 'self' 'unsafe-inline'; script-src 'self' apis.google.com ajax.googleapis.com *.google-analytics.com; img-src 'self' data *.google-analytics.com")
    // When 'unsafe-inline' is supported...
    next()
  })

  app.use('/s/', express.static(__dirname + '/app/public'))
  app.use('/', express.static(__dirname + '/app/rootfiles'))

  app.use(function(req, res, next) {
    res.header('X-Geek-Status', 'You\'re awesome. p.s: Narwhals.')
    next()
  })

  if (module_exists('../spacemaybe/spacemaybe server')) {
    console.log('starting game server')
    require('../spacemaybe/spacemaybe server')(server
      , __dirname + '/app/public/spacemaybe/vendor/primus.js'
      , userKeyMap)
  }

  server.listen(app.get('port'))
}

function module_exists( name ) {
  try { return require.resolve( name ) }
  catch( e ) { return false }
}


require('./app/server/models/account')(db, function(Account) {
  passport.use(Account.createStrategy())
  passport.serializeUser(Account.serializeUser())
  passport.deserializeUser(Account.deserializeUser())

  // Development-specific options.
  if (env === 'development') {
    console.log('Using development environment.')

    app.use(errorHandler({ dumpExceptions: true, showStack: true }))

    db.once('open', function() {
      finalAndOpen()
      require('./app/server/router')(app, passport, Account, 'dev', userKeyMap)
    })
  }

  // Production-environment-specific options.
  else if (env === 'production') {
    console.log('Using production environment.')

    app.set('trust proxy', 1)

    app.use(function (req, res, next) {
      // HSTS
      res.setHeader('Strict-Transport-Security', 'max-age=8640000; includeSubDomains')

      // Redirect all traffic to https
      if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(301, 'https://' + req.host + (req.path || '/'))
      } else next()
    })

    db.once('open', function() {
      finalAndOpen()
      require('./app/server/router')(app, passport, Account, 'live', userKeyMap)
    })
  }
})
