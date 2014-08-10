var express = require('express')
  , router  = express.Router()
  , marked = require('marked')
  , moment = require('moment')
  , blog    = require('../modules/blog')

module.exports = function(key) {
  blog.loadDb(key)
  return router
}

router.post('/kudos', function(req, res) {
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
          res.status(200)
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
          res.status(200)
          res.json({ kudos: doc.kudos, self: false })
        }
      })
    }
  } else {
    res.status(400).end()
  }
})

router.get('/', function(req, res) {
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

router.post('/', function(req, res) {
  if (req.user && req.user.type && req.user.type === 'admin') {
    blog.addArticle({
        title: req.param('title')
      , body: marked(req.param('body'))
      , raw: req.param('body')
    }, function(error) {
      if (error) res.end('Internal Server Error: ' + error)
      else {
        res.status(200).redirect('../blog')
      }
    })
  } else {
    console.log('WARNING: Received an unauthorized blog-new POST request!')
    res.status(403).end()
  }
})

router.delete('/', function(req, res){
  if (req.user && req.user.type && req.user.type === 'admin') {
    blog.removeArticle({
      title: req.param('title')
    }, function(error) {
      if (error) res.end('Internal Server Error: ' + error)
      else {
        res.status(200).redirect('../blog')
      }
    })
  } else {
    console.log('WARNING: Received an unauthorized blog-delete POST request!')
    res.status(403).end()
  }
})
