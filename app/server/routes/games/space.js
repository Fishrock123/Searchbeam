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
  if (!req.user)
    return res.status(401).end()
  if (!req.user.games || !req.user.games.space)
    return res.status(400).end()

  res.type('json')
  res.status(200)
  res.json({ color: req.user.games.space.color })
})

router.post('/color', function(req, res) {
  if (!req.user)
    return res.status(401).end()
  if (!req.body.color)
    return res.status(400).end()

  res.type('json')

  if (!req.user.games || !req.user.games.space)
    res.status(404).json({ err: 'You have never played spacemaybe.' })

  if (!color_.valid(req.body.color))
    res.status(400).json({ err: 'Server received an invalid color code.' })

  else if (color_.dark(req.body.color))
    res.status(400).json({ err: 'That color is too dark.' })

  else if (color_.white(req.body.color))
    res.status(400).json({ err: 'That color is too white.' })

  else {
    Account.findByIdAndUpdate(req.user._id, { 'games.space': { color: req.body.color }}, null, function(err, doc) {
      if (err) {
        console.log(err)
        return res.status(500).end()
      }
      res.status(201)
      res.json({ color: req.body.color })
    })
  }
})
