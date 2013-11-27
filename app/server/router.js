
// Import all the stuffs!
var fs = require('fs')
	, marked = require('marked')
	, sanitize = require('validator').sanitize
	, moment = require('moment')
	, jade = require('jade')
	, highlight = require('highlight.js')
	, blog = require('./modules/blog')
	, validate = require('./modules/validate')
	, keys = require('../../keys.json')
	, version = require('../../package.json').version;

var subdirs = [[/xe_/, 'xenon/'], [/kapp_/, 'kappacino/']];

module.exports = function(app, passport, Account, dbString) {
	var timeout, status, ip;

	validate.loadAuth(Account);

	blog.loadDb(setRoutes, dbString);

	function setRoutes() {

		app.get('/', function(req, res) {
			res.type('html');
			res.render('home', {
				query: req.query,
				user: req.user,
				version: version
			});
		});

		fs.readdir(__dirname + '/views', function(err, files) {
			for (var i = 0; i < files.length; i++) {
				loadPage(files[i]);
			}
		});

		function loadPage(page) {
			var ext = page.slice(page.lastIndexOf('.', page.length))
				, pageName = page.slice(0, page.indexOf('.'))
				, dir = pageName;
			for (var i = 0; i < subdirs.length; i++) {
				if (subdirs[i][0].test(pageName)) {
					dir = pageName.replace(subdirs[i][0], subdirs[i][1]);
					break;
				}
			}
			if (ext === '.jade') {
				app.get('/' + dir, function(req, res) {
					res.type('html');
					res.render(pageName, {
						query: req.query,
						user: req.user,
						version: version
					});
				});
			} else if (ext === '.html') {
				app.get('/' + dir, function(req, res) {
					res.type('html');
					res.sendfile(__dirname + '/views/' + page);
				});
			}
		}

		app.post('/auth', passport.authenticate('local'), function(req, res, next) {
			res.type('json');
			passport.authenticate('local', function(err, user, info) {
				console.log(info);
				if (err) {
					res.json({ error: err });
					return next(err);
				}
				if (!user) {
					res.json({ error: "That user does not exist." });
					return res.redirect('/register');
				}
				req.logIn(user, function(err) {
					if (err) { return next(err); }
					console.log('Successfully authenticated ' + req.user.username);
					jade.renderFile(__dirname + '/views/auth/button.jade', { user: req.user }, function(err, html) {
						if (err) { return next(err); }
						res.json({ html: html, success: "Welcome back " + user.username + "!" });
						return;
					});
				});
			})(req, res, next);
		});

		app.post('/logout', function(req, res) {
			if (req.user) {
				console.log('Logging ' + req.user.username + ' out.');
				req.logout();
			}
			res.type('html');
			res.render('auth/button');
		});

		app.post('/validate', function(req, res) {
			var out = {};
			res.type('json');
			if (req.body.password) {
				out.pass = validate.password(req.body.password);
			}
			if (req.body.username) {
				out.user = validate.username(req.body.username);
				if (out.user.valid) {
					validate.userAvaliable(req.body.username, function(avail) {
						out.user = avail;
						res.json(out);
					});
				}
			}
			if (out.user === undefined || out.user.err) {
				res.json(out);
			}
		});

		app.post('/register', function(req, res) {
			if (!req.body.username || !req.body.password) return res.status(400).redirect('/signup');
			console.log('registering a new account');
			Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
				if (err) {
					console.log(err);
					res.status(400).redirect('/signup');
				} else {
					res.redirect('/');
					console.log('Successfully registered a new account!');
				}
			});
		});

		app.post('/blog', function(req, res) {
			if (req.body && req.body.postid) {
				if (req.signedCookies['' + req.body.postid] !== 'true') {
					blog.kudo(req.body.postid, 1, function(err, doc) {
						if (err) {
							console.err('Kudos error: ' + err);
							res.end(500);
							return;
						} else {
							res.type('json');
							res.cookie('' + req.body.postid, 'true', {
								signed: true,
								maxAge: 90000000000 // Probably like a few years.
							});
							res.json({ kudos: doc.kudos, self: true });
						}
					});
				} else if (req.body.action = 'unkudo') {
					blog.kudo(req.body.postid, -1, function(err, doc) {
						if (err) {
							console.err('Kudos error: ' + err);
							res.end(500);
							return;
						} else {
							res.type('json');
							res.clearCookie('' + req.body.postid, 'true', {
								signed: true
							});
							res.json({ kudos: doc.kudos, self: false });
						}
					});
				}
			} else {
				res.end(400);
			}
		});

		app.post('/blog-posts', function(req, res) {
			function sendOnePost(err, article) {
				if (err) {
					console.log(err);
					res.status(400).end('Internal Server Error: ' + err);
				} else {
					res.type('html');
					res.render('blogPost', {
						post: article[0],
						moment: moment,
						cookies: req.signedCookies
					});
				}
			}

			if (req.body.title) {
				blog.getByTitle(req.body.title, sendOnePost);
			} else if (req.body.post_id) {
				blog.getByID(req.body.post_id, sendOnePost);
			} else {
				blog.getByPage(req.body.page, 4, function(err, articles, page, lastPage) {
					page = page / 4;
					if (err) {
						console.log(err);
						res.status(400).end('Internal Server Error: ' + err);
					} else {
						res.type('html');
						res.render('blogPosts', {
							posts: articles,
							moment: moment,
							page: page < 1 ? 0 : page,
							lastPage: lastPage,
							cookies: req.signedCookies
						});
					}
				});
			}
		});

		app.post('/blog-new', function(req, res) {
			if (req.user && req.user.type && req.user.type === 'admin') {
				blog.addArticle({
					title: sanitize(req.param('title')).xss(),
					body: marked(req.param('body'))
				}, function(error) {
				   if (error) res.end('Internal Server Error: ' + error);
				   else {
					res.status(200);
					res.redirect('../blog');
				   }
				});
			} else {
				console.log('WARNING: Received an unauthorized blog-new POST request!');
				res.status(403).end();
			}
		});

		app.post('/blog-delete', function(req, res){
			if (req.user && req.user.type && req.user.type === 'admin') {
				blog.removeArticle({
					title: req.param('title')
				}, function(error) {
				   if (error) res.end('Internal Server Error: ' + error);
				   else {
					res.status(200);
					res.redirect('../blog');
				   }
				});
			} else {
				console.log('WARNING: Received an unauthorized blog-delete POST request!');
				res.status(403).end();
			}
		});


		// Xenon stuff

		timeout = undefined;
		status = 'Server Offline';
		// Server IP
		ip = '127.0.0.1';

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
		};

		// Receive how many people are online
		app.get('/xenon/update', function(req, res) {
			if (req.query.key === keys.xenon.update) {
				ip = req.query.ip.split(":")[0];
				res.end();

				formStatus(true, req.query.num);

				if (timeout) clearTimeout(timeout);
				timeout = setTimeout(function() {
					formStatus(false, 0);
				}, 20000);
			}
		});

		// Send how many people are online
		app.get('/xenon/status', function(req, res) {
			res.end(status);
		});

		// Send the IP Address
		app.get('/xenon/ip', function(req, res) {
			res.end(ip);
		});


		// Site 404
		app.use(function(req, res, next) {
			res.status(404);

			if (req.accepts('html')) {
				res.type('html');
				res.render('404', {
					url: req.get('host') + req.url,
					user: req.user,
					version: version
				});
				return;
			}

			if (req.accepts('json')) {
				res.type('json');
				res.json({ error: '404: Not found' });
				return;
			}

			res.type('txt');
			res.send('404: Not found');
		});

		console.log('searchbeam.jit.su has successfully started!');
	}
};
