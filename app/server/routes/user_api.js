var express = require('express')
  , router  = express.Router()
  , Account

module.exports = function(Acct) {
  Account = Acct
  return router
}

router.get('/data', function(req, res) {
  if (!req.user) return res.status(401).end()

  var out = {
      username: req.user.username
    , displayname: req.user.displayname || req.user.username
    , type: req.user.type
  }
  if (!req.query.game) return res.json(out)

  if (req.query.game === 'space') {

    if (!req.user.games) {
      Account.findByIdAndUpdate(req.user._id, { games: { space: { color: '#1AC' }}}, null, function(err, doc) {
        if (err) {
          console.log(err)
          res.status(500).end()
          return
        }
        out.user_game_data = {
          color: doc.games.space.color
        }
        res.json(out)
      })

    } else if (!req.user.games.space) {
      Account.findByIdAndUpdate(req.user._id, { 'games.space': { color: '#1AC' }}, null, function(err, doc) {
        if (err) {
          console.log(err)
          res.status(500).end()
          return
        }
        out.user_game_data = {
          color: doc.games.space.color
        }
        res.json(out)
      })

    } else {
      out.user_game_data = {
        color: req.user.games.space.color
      }
      res.json(out)
    }
  }
})
