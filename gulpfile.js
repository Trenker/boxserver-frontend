
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

gulp.task("css", function() {
	return gulp.src("./src/main.less")
		.pipe(less())
		.pipe(prefix())
		.pipe(uncss({html: "./src/styleguide.html"}))
		.pipe(compress())
		.pipe(gulp.dest("./build"))
});

gulp.task("js", function() {
	return gulp.src("./src/scripts.js")
		.pipe(uglify())
		.pipe(gulp.dest("./build"))
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
		.pipe(replace(/boxserver_url/i, process.env.BASEURL || "http://localhost:8001/"))
		.pipe(gulp.dest("./build"))
});

gulp.task("browser-sync", ["html"], function() {
	browserSync({
		open: false,
		server: {
			baseDir: "./build"
		}
	})
});

gulp.task("clean", function(cb) {
	del("./src/build/**/*.*", {force: true}, cb);
});

gulp.task("full", ["clean"], function() {
	return gulp.start("html");
});

gulp.task("default", ["html"]);

gulp.task("watch", ["browser-sync"], function() {
	gulp.watch("./src/**/*.*", ["html", browserSync.reload])
});

gulp.task("src", function() {
	var js = gulp.src("./src/scripts.js")
		.pipe(replace(/boxserver_url/i, process.env.BASEURL || "http://localhost:8001/"))
		.pipe(gulp.dest("./build"));

	var css = gulp.src("./src/main.less")
		.pipe(less())
		.pipe(prefix())
		.pipe(gulp.dest("./build"));

	var html = gulp.src("./src/styleguide.html")
		.pipe(gulp.dest("./build"));

	return merge(js, css, html);
});

gulp.task("dev", ["src", "browser-sync"], function() {
	gulp.watch("./src/**/*.*", ["src", browserSync.reload])
});

