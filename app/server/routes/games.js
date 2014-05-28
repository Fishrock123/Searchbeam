var express = require('express')
  , router  = express.Router()
  , crypto  = require('crypto')
  , Account
  , userKeyMap
  , keys

module.exports = function(Acct, uKM, kys) {
  Account    = Acct
  userKeyMap = uKM
  keys       = kys

  return router
}

router.get('/session_key', function(req, res) {
  if (!req.user) return res.status(401).end()

  res.type('json')
  crypto.randomBytes(48, function(ex, buf) {
    if (ex) {
      console.error(ex)
      res.json(500, { err: 'Internal server error. Please contact @Fishrock123 <fishrock123@rocketmail.com>' })
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

    res.json(201, { session_key: token })
  })
})
