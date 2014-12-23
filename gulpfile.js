
"use strict";

var gulp        = require("gulp");
var browserSync = require("browser-sync");
var less        = require("gulp-less");
var prefix      = require("gulp-autoprefixer");
var uncss       = require("gulp-uncss");
var compress    = require("gulp-csso");
var uglify      = require("gulp-uglify");
var minifyhtml  = require('gulp-minify-html');
var inline      = require('gulp-inline-source');
var replace     = require('gulp-replace');
var merge       = require("merge-stream");
var del         = require("del");
var runSequence = require('run-sequence');

var prefixOptions = {
	browsers: ['last 2 versions'],
	cascade: false
};
var buildDir = "./build";
var baseUrl  = process.env.BASEURL || "http://localhost:8001/";

gulp.task("css", function() {
	return gulp.src("./src/main.less")
		.pipe(less())
		.pipe(prefix(prefixOptions))
		.pipe(uncss({html: "./src/styleguide.html"}))
		.pipe(compress())
		.pipe(gulp.dest(buildDir))
});

gulp.task("js", function() {
	return gulp.src("./src/scripts.js")
		.pipe(uglify())
		.pipe(gulp.dest(buildDir))
});

gulp.task("html", ["css", "js"], function() {
	return gulp.src("./src/index.html")
		.pipe(inline({
			compress: false
		}))
		.pipe(minifyhtml({
			quotes: true,
			empty: true
		}))
		.pipe(replace(/boxserver_url/i, baseUrl))
		.pipe(gulp.dest(buildDir))
});

gulp.task("browser-sync", ["html"], function() {
	browserSync({
		open: false,
		server: {
			baseDir: buildDir
		}
	})
});

gulp.task("purge", function(cb) {
	del(buildDir + "/**/*.*", {force: true}, cb);
});

gulp.task("clean", function(cb) {
	del([buildDir + "/**/*.js", buildDir + "/**/*.css"], {force: true}, cb);
});

gulp.task("release", function(cb) {
	runSequence("purge", "html", "clean", cb)
});

gulp.task("default", ["html"]);

gulp.task("dev", function() {
	var js = gulp.src("./src/scripts.js")
		.pipe(replace(/boxserver_url/i, baseUrl))
		.pipe(gulp.dest(buildDir));

	var css = gulp.src("./src/main.less")
		.pipe(less())
		.pipe(prefix(prefixOptions))
		.pipe(gulp.dest(buildDir));

	var html = gulp.src("./src/styleguide.html")
		.pipe(gulp.dest(buildDir));

	return merge(js, css, html);
});

gulp.task("watch", ["dev", "browser-sync"], function() {
	gulp.watch("./src/**/*.*", ["src", browserSync.reload])
});
