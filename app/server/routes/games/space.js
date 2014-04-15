var express = require('express')
  , router  = express.Router()
  , color_  = require('./modules/color_')
  , Account

module.exports = function(Acct) {
  Account = Acct
  return router
}

// stuff for spacemaybe

router.get('/color', function(req, res) {
  if (req.user && req.user.games && req.user.games.space) {
    res.type('json')
    res.json({ color: req.user.games.space.color })
    return
  }
  res.status(401).end()
})

router.post('/color', function(req, res) {
  if (req.user && req.body.color) {
    res.type('json')

    if (!req.user.games || !req.user.games.space)
      res.json({ err: 'You have never played spacemaybe.' })

    if (!color_.valid(req.body.color))
      res.json({ err: 'Server received an invalid color code.' })

    else if (color_.dark(req.body.color))
      res.json({ err: 'That color is too dark.' })

    else if (color_.white(req.body.color))
      res.json({ err: 'That color is too white.' })

    else {
      Account.findByIdAndUpdate(req.user._id, { 'games.space': { color: req.body.color }}, null, function(err, doc) {
        if (err) {
          console.log(err)
          return res.status(500).end()
        }
        res.json({ color: req.body.color })
      })
    }
  } else {
    res.status(400).end()
  }
})
