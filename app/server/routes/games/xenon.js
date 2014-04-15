var express = require('express')
  , router  = express.Router()
  , status  = 'Server Offline'
  , ip      = '127.0.0.1'
  , timeout
  , key

module.exports = function(keys) {
  key = keys.xenon.update
  return router
}

// Xenon stuff

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

// Receive how many people are online from game server
router.post('/update', function(req, res) {
  if (req.query.key === key) {
    ip = req.query.ip.split(":")[0]
    res.end()

    formStatus(true, req.query.num)

    clearTimeout(timeout)
    timeout = setTimeout(function() {
      formStatus(false, 0)
    }, 20000)
  }
})

// Send how many people are online
router.get('/status', function(req, res) {
  res.type('txt')
  res.end(status)
})

// Send the IP Address
app.get('/ip', function(req, res) {
  res.type('txt')
  res.end(ip)
})
