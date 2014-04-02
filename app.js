
// Import all the stuffs!
var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , passport = require('passport')
  , mongoose = require('mongoose')
  , passportLocalMongoose = require('passport-local-mongoose')
  , compress = require('compression')
  , keys = require(__dirname + '/keys.json')
  , version = require(__dirname + '/package.json').version
  , db
  , session_opts = {
      secret: keys.express.session
    }
  , userKeyMap = {}

console.log('APP VERSION = ' + version)

// Use all the settings! (Mostly.)
app.set('port', 8080)
app.set('views', __dirname + '/app/server/views')
app.set('view engine', 'jade')
app.locals.pretty = true
app.use(compress())
app.use(express.favicon(__dirname + '/app/public/SB-Logo.ico'))
app.use(express.json())
app.use(express.urlencoded())
app.use(express.cookieParser(keys.express.cookies))

app.use(express.cookieSession({
    secret: keys.express.session
  , cookie: {
        signed: true
      , maxAge: 1000 * 60 * 60 * 4
    }
}))
app.use(express.methodOverride())
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
    if (Date.now - userKeyMap[key].time > 20000)
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
  app.use(app.router)

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
  app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
    db.once('open', function() {
      finalAndOpen()
      require('./app/server/router')(app, passport, Account, keys.blog.dev, userKeyMap)

      console.log('Using development environment.')
    })
  })

  // Production-environment-specific options.
  app.configure('production', function() {
    // Redirect all traffic to https
    app.use(function (req, res, next) {
      // HSTS
      res.setHeader('Strict-Transport-Security', 'max-age=8640000; includeSubDomains')

      if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(301, 'https://' + req.host + (req.path || '/'))
      } else next()
    })

    db.once('open', function() {
      finalAndOpen()
      require('./app/server/router')(app, passport, Account, keys.blog.live, userKeyMap)

      console.log('Using production environment.')
    })
  })
})
