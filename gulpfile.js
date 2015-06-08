// Load libs and plugins
var gulp = require('gulp');
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var watchify = require('watchify');
var browserify = require('browserify');
var plugins = {
	uglify: require('gulp-uglify'),
	plumber: require('gulp-plumber')
};

// Set config
var config = {
	name: 'Sortable2',
	distPath: 'dist',
	watch: true
};
gulp.task('config-production', function () {
	config.watch = false;
});

// JavaScript
gulp.task('Sortable2-js', function() {
	var bundleShare = function (b, fileName, compress) {
		var stream = b.bundle()
			.pipe(source(fileName))
			.pipe(plugins.plumber());
		if (compress) {
			stream = stream
				.pipe(buffer())
				.pipe(plugins.uglify());
		}
		stream.pipe(gulp.dest(config.distPath));
	};

	var b = browserify({
		cache: {},
		packageCache: {},
		fullPaths: false
	});

	if (config.watch) {
		b = watchify(b);
		b.on('update', function(){
			bundleShare(b, config.name + '.js');
			bundleShare(b, config.name + '.min.js', true);
		});
	}

	b.add('./src/index.js');
	bundleShare(b, config.name + '.js');
	bundleShare(b, config.name + '.min.js', true);
});

// Grouped tasks for run
var tasks = [
	'Sortable2-js'
];
gulp.task('default', tasks);
gulp.task('production', ['config-production'].concat(tasks));