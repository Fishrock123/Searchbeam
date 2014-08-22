
// Import all the stuffs!
var fs      = require('fs')
  , express = require('express')

  // json
  , keys    = require('../../keys.json')
  , version = require('../../package.json').version

  // pages
  , subdirs = ['xenon']

  // api
  , auth     = require('./routes/auth')
  , user_api = require('./routes/user_api')
  , blog_api = require('./routes/blog_api')
  , games    = require('./routes/games')


module.exports = function(app, passport, Account, env, userKeyMap) {

  // Homepage
  app.get('/', function(req, res) {
    res.type('html')
    res.render('home', {
      query: req.query,
      user: req.user,
      version: version
    })
  })


  // Pages
  var pages = express.Router()
  app.use(pages)

  fs.readdir(__dirname + '/views', function(err, files) {
    files.forEach(loadPage)
  })

  // Recursively loads dir trees of (jade / html) pages.
  function loadPage(page, supdir) {
    var ext = page.slice(page.lastIndexOf('.', page.length))
      , view = page.slice(0, page.indexOf('.'))
      , dir = view
    if (!(supdir > 0)) {
      supdir += '/'
      dir = supdir + dir
      view = supdir + view
      page = supdir + page
    }
    if (ext === '.jade') {
      pages.get('/' + dir, function(req, res) {
        res.type('html')
        res.render(view, {
          query: req.query,
          user: req.user,
          version: version
        })
      })
    } else if (ext === '.html') {
      pages.get('/' + dir, function(req, res) {
        res.type('html')
        res.sendfile(__dirname + '/views/' + page)
      })
    } else if (page.indexOf('.') === -1 /* this is a folder */
        && subdirs.some(function(subdir) {
          return subdir === page
        })) {
      fs.readdir(__dirname + '/views/' + page, function(err, files) {
        for (var i = files.length; i--;) {
          loadPage(files[i], page)
        }
      })
    }
  }


  // API
  var api = express.Router()
  app.use('/api/v1', api)

  api.use('/auth', auth(Account, passport))
  api.use('/user', user_api(Account))
  api.use('/blog', blog_api(keys.blog[env]))
  api.use('/game', games(Account, userKeyMap, keys))


  // Site 404
  app.use(function(req, res, next) {
    res.status(404)

    if (req.accepts('html')) {
      res.type('html')
      res.render('404', {
        url: req.get('host') + req.url,
        user: req.user,
        version: version
      })
      return
    }

    if (req.accepts('json')) {
      res.type('json')
      res.status(404)
      res.json({ error: '404: Not found' })
      return
    }

    res.type('txt')
    res.send('404: Not found')
  })

  console.log('Routes loaded.\nsearchbeam.jit.su has successfully started!')
}
