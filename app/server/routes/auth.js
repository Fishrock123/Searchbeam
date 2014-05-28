var express  = require('express')
  , router   = express.Router()
  , jade     = require('jade')
  , validate = require('../modules/validate')
  , Account
  , passport
  // terrible ../ hack for absolute pathing.
  , btn_path = __dirname.slice(0, __dirname.lastIndexOf('/'))
      + '/views/auth/button.jade'

module.exports = function(Acct, psspt) {
  Account  = Acct
  passport = psspt

  validate.loadAuth(Account)

  return router
}

router.post('/login', function(req, res, next) {
  res.type('json')
  passport.authenticate('local', function(err, user) {
    if (err) {
      res.json(500, { error: err })
      return next(err)
    }
    if (!user) {
      res.json(401, { error: "That user does not exist." })
      return
    }
    req.logIn(user, function(err) {
      if (err) { return next(err) }
      console.log('Successfully authenticated ' + req.user.username)
      jade.renderFile(btn_path, { user: req.user }, function(err, html) {
        if (err) { return next(err) }
        res.json(200, {
            username: user.username
          , displayname: user.displayname || user.username
          , html: html
          , success: "Welcome back " + user.username + "!"
        })
        return
      })
    })
  })(req, res, next)
})

router.post('/logout', function(req, res) {
  if (req.user) {
    console.log('Logging ' + req.user.username + ' out.')
    req.logout()
  }
  res.type('html')
  res.render('auth/button')
})

router.post('/validate', function(req, res) {
  res.type('json')
  validate.form(req.body, function(out) {
    res.json(200, out)
  })
})

router.post('/register', function(req, res) {
  res.type('json')
  validate.form(req.body, function(out) {
    if (!out.user || out.user.err || !out.pass || out.pass.err) {
      res.json(400, out)
    } else if (out.user.valid && out.pass.valid) {
      console.log('registering a new account with username: ' + req.body.username)
      Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
          console.log(err)
          res.json(500, { err: 'Error registering account. Please contact @Fishrock123 <fishrock123@rocketmail.com>'})
        } else {
          out.registered = true
          res.json(201, out)
          console.log('Successfully registered a new account: ' + req.body.username)
        }
      })
    }
  })
})
