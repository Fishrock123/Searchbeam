module.exports = function(db, cb) {
  var Account = new require('mongoose').Schema({
      type: { type: String, default: 'user' },
      displayname: String,
      hash_version: { type: Number, default: 1 },
      games: Object
  })
  Account.plugin(require('passport-local-mongoose'), require('../../../keys.json').passport.options)

  cb(db.model('Account', Account))
}