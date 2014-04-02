
var assert = require('assert')

var _valid = /^#([0-9A-F]{3}$|[0-9A-F]{6}$)/
  , _dark  = /^#([0-6]{3}$|([0-6][0-9A-F]){3}$)/
  , _white = /^#([E-F]{3}$|([E-F][0-9A-F]){3}$)/

// todo: proper unit tests

assert(_valid.test('#EEE'), 'Color 1')
assert(_valid.test('#A67'), 'Color 2')
assert(_valid.test('#B7B3BD'), 'Color 3')
assert(_valid.test('#053428'), 'Color 4')
assert( ! _valid.test('EEE'), 'Color 5')
assert( ! _valid.test('#HTK'), 'Color 6')
assert( ! _valid.test('#aaa'), 'Color 7') // I only use capitals in hex color codes.
assert( ! _valid.test('#0572E3B1'), 'Color 8')
assert( ! _valid.test('#E3B6'), 'Color 9')
assert(_dark.test('#000'), 'Color 10')
assert(_dark.test('#666'), 'Color 11')
assert(_dark.test('#0F0F0F'), 'Color 12')
assert(_dark.test('#6A646E'), 'Color 13')
assert( ! _dark.test('#777'), 'Color 14')
assert( ! _dark.test('#FFF'), 'Color 15')
assert( ! _dark.test('#787E73'), 'Color 16')
assert( ! _dark.test('#E6FA9B'), 'Color 17')
assert(_white.test('#FFF'), 'Color 18')
assert(_white.test('#E0EFE9'), 'Color 19')
assert( ! _white.test('#DDD'), 'Color 20')
assert( ! _white.test('#A7389C'), 'Color 21')

module.exports = {
  valid: function(hex) {
    return _valid.text(hex)
  },

  dark: function(hex) {
    return _dark.text(hex)
  },

  white: function(hex) {
    return _white.text(hex)
  }
}
