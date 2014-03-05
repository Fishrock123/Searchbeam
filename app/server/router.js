
// Import all the stuffs!
var fs = require('fs')
  , crypto = require('crypto')
  , assert = require('assert')
  , marked = require('marked')
  , sanitize = require('validator').sanitize
  , moment = require('moment')
  , jade = require('jade')
  , blog = require('./modules/blog')
  , validate = require('./modules/validate')
  , keys = require('../../keys.json')
  , version = require('../../package.json').version
  , subdirs = ['xenon', 'kappacino']

module.exports = function(app, passport, Account, dbString, userKeyMap) {
  var timeout, status, ip

  validate.loadAuth(Account)

  blog.loadDb(setRoutes, dbString)

  function setRoutes() {

    app.get('/', function(req, res) {
      res.type('html')
      res.render('home', {
        query: req.query,
        user: req.user,
        version: version
      })
    })

    fs.readdir(__dirname + '/views', function(err, files) {
      files.forEach(loadPage)
    })

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
        app.get('/' + dir, function(req, res) {
          res.type('html')
          res.render(view, {
            query: req.query,
            user: req.user,
            version: version
          })
        })
      } else if (ext === '.html') {
        app.get('/' + dir, function(req, res) {
          res.type('html')
          res.sendfile(__dirname + '/views/' + page)
        })
      } else if (page.indexOf('.') === -1
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

    app.post('/auth', function(req, res, next) {
      res.type('json')
      passport.authenticate('local', function(err, user) {
        if (err) {
          res.status(500)
          res.json({ error: err })
          return next(err)
        }
        if (!user) {
          res.status(401)
          res.json({ error: "That user does not exist." })
          return
        }
        req.logIn(user, function(err) {
          if (err) { return next(err) }
          console.log('Successfully authenticated ' + req.user.username)
          jade.renderFile(__dirname + '/views/auth/button.jade', { user: req.user }, function(err, html) {
            if (err) { return next(err) }
            res.json({
                username: user.username
              , displayname: user.displayname || user.username
              , html: html
              , success: "Welcome back " + user.username + "!"
            });
            return
          })
        })
      })(req, res, next)
    })

    app.post('/logout', function(req, res) {
      if (req.user) {
        console.log('Logging ' + req.user.username + ' out.')
        req.logout()
      }
      res.type('html')
      res.render('auth/button')
    })

    app.post('/validate', function(req, res) {
      res.type('json')
      validate.form(req.body, function(out) {
        res.json(out)
      })
    })

    app.post('/register', function(req, res) {
      res.type('json')
      validate.form(req.body, function(out) {
        if (!out.user || out.user.err || !out.pass || out.pass.err) {
          res.status(400)
          res.json(out)
        } else if (out.user.valid && out.pass.valid) {
          console.log('registering a new account with username: ' + req.body.username)
          Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
            if (err) {
              console.log(err)
              res.status(500).json({ err: 'Error registering account. Please contact @Fishrock123 <fishrock123@rocketmail.com>'})
            } else {
              out.registered = true
              res.json(out)
              console.log('Successfully registered a new account!')
            }
          })
        }
      })
    })

    app.get('/user_data', function(req, res) {
      if (!req.user) return res.status(401).end()

      var out = {
          username: req.user.username
        , displayname: req.user.displayname || req.user.username
        , type: req.user.type
      }
      if (!req.query.game) return res.json(out)

      if (req.query.game === 'conquest') {

        if (!req.user.games) {
          Account.findByIdAndUpdate(req.user._id, { games: { conquest: { color: '#1AC' }}}, null, function(err, doc) {
            if (err) {
              console.log(err)
              res.status(500).end()
              return
            }
            out.user_game_data = {
              color: doc.games.conquest.color
            }
            res.json(out)
          })

        } else if (!req.user.games.conquest) {
          Account.findByIdAndUpdate(req.user._id, { 'games.conquest': { color: '#1AC' }}, null, function(err, doc) {
            if (err) {
              console.log(err)
              res.status(500).end()
              return
            }
            out.user_game_data = {
              color: doc.games.conquest.color
            }
            res.json(out)
          })

        } else {
          out.user_game_data = {
            color: req.user.games.conquest.color
          }
          res.json(out)
        }
      }
    })

    app.post('/blog', function(req, res) {
      if (req.body && req.body.postid) {
        if (req.signedCookies['' + req.body.postid] !== 'true') {
          blog.kudo(req.body.postid, 1, function(err, doc) {
            if (err) {
              console.err('Kudos error: ' + err)
              res.status(500).end()
              return
            } else {
              res.type('json')
              res.cookie('' + req.body.postid, 'true', {
                signed: true,
                maxAge: 90000000000 // Probably like a few years.
              })
              res.json({ kudos: doc.kudos, self: true })
            }
          })
        } else if (req.body.action = 'unkudo') {
          blog.kudo(req.body.postid, -1, function(err, doc) {
            if (err) {
              console.err('Kudos error: ' + err)
              res.status(500).end()
              return
            } else {
              res.type('json')
              res.clearCookie('' + req.body.postid, 'true', {
                signed: true
              })
              res.json({ kudos: doc.kudos, self: false })
            }
          })
        }
      } else {
        res.status(400).end()
      }
    })

    app.post('/blog-posts', function(req, res) {
      function sendOnePost(err, article) {
        if (err) {
          console.log(err)
          res.status(400).end('Internal Server Error: ' + err)
        } else {
          res.type('html')
          res.render('blog/Post', {
            post: article[0],
            moment: moment,
            cookies: req.signedCookies
          })
        }
      }

      if (req.body.title) {
        blog.getByTitle(req.body.title, sendOnePost)
      } else if (req.body.post_id) {
        blog.getByID(req.body.post_id, sendOnePost)
      } else {
        blog.getByPage(req.body.page, 4, function(err, articles, page, lastPage) {
          page = page / 4
          if (err) {
            console.log(err)
            res.status(400).end('Internal Server Error: ' + err)
          } else {
            res.type('html')
            res.render('blog/Posts', {
              posts: articles,
              moment: moment,
              page: page < 1 ? 0 : page,
              lastPage: lastPage,
              cookies: req.signedCookies
            })
          }
        })
      }
    })

    app.post('/blog-new', function(req, res) {
      if (req.user && req.user.type && req.user.type === 'admin') {
        blog.addArticle({
          title: sanitize(req.param('title')).xss(),
          body: marked(req.param('body'))
        }, function(error) {
           if (error) res.end('Internal Server Error: ' + error)
           else {
          res.status(200)
          res.redirect('../blog')
           }
        })
      } else {
        console.log('WARNING: Received an unauthorized blog-new POST request!')
        res.status(403).end()
      }
    })

    app.post('/blog-delete', function(req, res){
      if (req.user && req.user.type && req.user.type === 'admin') {
        blog.removeArticle({
          title: req.param('title')
        }, function(error) {
          if (error) res.end('Internal Server Error: ' + error)
          else {
            res.status(200)
            res.redirect('../blog')
          }
        })
      } else {
        console.log('WARNING: Received an unauthorized blog-delete POST request!')
        res.status(403).end()
      }
    })

    // Conquest stuff

    app.get('/game_session_key', function(req, res) {
      if (!req.user) return res.status(401).end()

      crypto.randomBytes(48, function(ex, buf) {
        if (ex) {
          console.error(ex)
          res.type('json')
          res.json({ err: 'Internal server error. Please contact @Fishrock123 <fishrock123@rocketmail.com>' })
          return
        }
        var token = buf.toString('hex')
          , user = {
              name: req.user.displayname || req.user.username
            , time: Date.now()
          }
        if (req.query.game)
          user.game = req.query.game
        if (req.user.games && req.user.games[req.query.game])
          user.user_game_data = req.user.games[req.query.game]

        userKeyMap[token] = user

        console.log(userKeyMap[token])
        res.type('json')
        res.json({ session_key: token })
      })
    })

    app.get('/conquest_color', function(req, res) {
      if (req.user && req.user.games && req.user.games.conquest) {
        res.type('json')
        res.json({ color: req.user.games.conquest.color })
        return
      }
      res.status(401).end()
    })

    var color_valid = /^#([0-9A-F]{3}$|[0-9A-F]{6}$)/
    var color_dark = /^#([0-6]{3}$|([0-6][0-9A-F]){3}$)/
    var color_white = /^#([E-F]{3}$|([E-F][0-9A-F]){3}$)/

    assert(color_valid.test('#EEE'), 'Color 1')
    assert(color_valid.test('#A67'), 'Color 2')
    assert(color_valid.test('#B7B3BD'), 'Color 3')
    assert(color_valid.test('#053428'), 'Color 4')
    assert( ! color_valid.test('EEE'), 'Color 5')
    assert( ! color_valid.test('#HTK'), 'Color 6')
    assert( ! color_valid.test('#aaa'), 'Color 7') // I only use capitals in hex color codes.
    assert( ! color_valid.test('#0572E3B1'), 'Color 8')
    assert( ! color_valid.test('#E3B6'), 'Color 9')
    assert(color_dark.test('#000'), 'Color 10')
    assert(color_dark.test('#666'), 'Color 11')
    assert(color_dark.test('#0F0F0F'), 'Color 12')
    assert(color_dark.test('#6A646E'), 'Color 13')
    assert( ! color_dark.test('#777'), 'Color 14')
    assert( ! color_dark.test('#FFF'), 'Color 15')
    assert( ! color_dark.test('#787E73'), 'Color 16')
    assert( ! color_dark.test('#E6FA9B'), 'Color 17')
    assert(color_white.test('#FFF'), 'Color 18')
    assert(color_white.test('#E0EFE9'), 'Color 19')
    assert( ! color_white.test('#DDD'), 'Color 20')
    assert( ! color_white.test('#A7389C'), 'Color 21')

    app.post('/conquest_color', function(req, res) {
      if (req.user && req.body.color) {
        res.type('json')

        if (!req.user.games || !req.user.games.conquest)
          res.json({ err: 'You have never played CONQUEST.' })

        if (!color_valid.test(req.body.color))
          res.json({ err: 'Server received an invalid color code.' })

        else if (color_dark.test(req.body.color))
          res.json({ err: 'That color is too dark.' })

        else if (color_white.test(req.body.color))
          res.json({ err: 'That color is too white.' })

        else {
          Account.findByIdAndUpdate(req.user._id, { 'games.conquest': { color: req.body.color }}, null, function(err, doc) {
            if (err) {
              console.log(err)
              return res.status(500).end()
            }
            res.json({ color: req.body.color })
          });
        }
      } else {
        res.status(400).end()
      }
    })


    // Xenon stuff

    app.get('/xenon', function(req, res) {
      res.type('html')
      res.render('xenon/home', {
        query: req.query,
        user: req.user,
        version: version
      })
    })

    timeout = undefined
    status = 'Server Offline'
    // Server IP
    ip = '127.0.0.1'

    formStatus = function(online, numPeople) {
      if (!online) {
        status = 'Server Offline'
      } else if (numPeople === '0') {
        status = 'Server Online'
      } else if (numPeople === '1') {
        status = '1 Person In-Game'
      } else {
        status = '' + numPeople + ' People In-Game'
      }
    }

    // Receive how many people are online
    app.get('/xenon/update', function(req, res) {
      if (req.query.key === keys.xenon.update) {
        ip = req.query.ip.split(":")[0]
        res.end()

        formStatus(true, req.query.num)

        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(function() {
          formStatus(false, 0)
        }, 20000)
      }
    })

    // Send how many people are online
    app.get('/xenon/status', function(req, res) {
      res.end(status)
    })

    // Send the IP Address
    app.get('/xenon/ip', function(req, res) {
      res.end(ip)
    })


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
        res.json({ error: '404: Not found' })
        return
      }

      res.type('txt')
      res.send('404: Not found')
    })

    console.log('searchbeam.jit.su has successfully started!')
  }
}
