$(document).ready(function() {
  var s          = 0
    , lastScroll = 0
    , $window    = $(window)
    , $header    = $('header')
    , $hdr_line  = $('header > .line')
    , page = window.location.pathname.slice(1)

  page = page || 'home'
  page = page.match(/home|about|contact/)
  if (page && page.length > 0)
    $('#' + page[0]).children().addClass('current-page')

  console.log('    ‚‚          awww yeah\n!  ∞¨ ⁻⁻)⧜      ascii pig\n    ˙˙˙˙        *oink* ;o') // awww yeah

  $window.scroll(function() {
    ((s = $window.scrollTop()) > 25 ? s = 25 : s) < 0 ? s = 0 : s
    if (s === lastScroll) return
    $header.css('line-height', (45 - s) + 'px')
    $hdr_line.css('height', (55 - s) + 'px')
    lastScroll = s
  })
})
