
// Import all the stuffs!
var	mongoose = require('mongoose');

var db, blogSchema, Post, postCount;

exports.loadDb = function(cb, dbString, native) {

	db = mongoose.createConnection(dbString, {
		db: {
			native_parser: true
		},
		server: {
			poolSize: 5,
			auto_reconnect: true
		}
	});

	db.on('error', console.error.bind(console, 'Blog connection error:'));

	blogSchema = new mongoose.Schema({
		title: {
			type: String,
			required: true,
			unique: true
		},
		body: { type: String, required: true },
		date:  { type: Date, default: Date.now },
		kudos: { type: Number, default: 0 }
	});

	Post = db.model('Post', blogSchema);

	Post.count({}, function(err, count) {
		postCount = count;
	});

	db.once('open', function() {
		console.log('Blog connected & loaded!');

		cb();
	});
};

exports.getByPage = function(index, amount, callback) {
	var page = index * 4
		, lastPage = postCount - 1;
	lastPage = lastPage < 0 ? 0 : lastPage;
	if (page >= lastPage) {
		page = lastPage;
		lastPage = true;
	} else {
		lastPage = false;
	}
	Post.find().sort('-date').skip(page).limit(4).exec(function(err, docs) {
		callback(err, docs, page, lastPage);
	});
};

exports.getByTitle = function(title, callback) {
	Post.find({ title: title }).limit(1).exec(callback);
};

exports.getByID = function(id, callback) {
	Post.find({ _id: id }).limit(1).exec(callback);
};

exports.kudo = function(id, amount, callback) {
	Post.findOneAndUpdate({ _id: id }, { $inc: { kudos: amount } }).exec(callback);
}

exports.addArticle = function(article, callback) {
	new Post(article).save(function(error) {
		if (error) {
			console.log('Failed to save ' + article.title);
			callback(error);
		}
		else {
			console.log('Successfully saved ' + article.title);
			++postCount;
			callback(error);
		}
	});
};

exports.removeArticle = function(article, callback) {
	Post.remove(article).exec(function(err, doc) {
		if (!err) --postCount;
		callback(err, doc);
	});
}
