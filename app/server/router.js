
// Import all the stuffs!
var fs      = require('fs')
  , express = require('express')

  // json
  , version = require('../../package.json').version


module.exports = function() {
  var routes = express.Router()

  // Homepage
  routes.get('/', function(req, res) {
    res.type('html')
    res.render('home', {
      query: req.query,
      version: version
    })
  })


  var pages = express.Router()
  routes.use(pages)

  // load our pages
  fs.readdir(__dirname + '/views', function(err, files) {
    files.forEach(loadPage)
  })
  // load a page
  function loadPage(page) {
    var ext = page.slice(page.lastIndexOf('.', page.length))
      , view = page.slice(0, page.indexOf('.'))

    if (ext === '.jade') {
      console.log(view)
      pages.get('/' + view, function(req, res) {
        res.type('html')
        res.render(view, {
          query: req.query,
          version: version
        })
      })
    }
  }


  // Site 404
  routes.use(function(req, res, next) {
    res.status(404)

    if (req.accepts('html')) {
      res.type('html')
      res.render('404', {
        url: req.get('host') + req.url,
        version: version
      })
      return
    }

    if (req.accepts('json')) {
      res.type('json')
      res.json({ error: '404: Not found' })
      return
    }

    res.type('txt')
    res.send('404: Not found')
  })

  return routes
}
