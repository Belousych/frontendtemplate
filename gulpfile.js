'use strict';

var gulp = require('gulp'),
	pug = require('gulp-pug'),
	plumber = require('gulp-plumber'),
	notify = require('gulp-notify'),
	watch = require('gulp-watch'),
	prefixer = require('gulp-autoprefixer'),
	uglify = require('gulp-uglify'),
	less = require('gulp-less'),
	sourcemaps = require('gulp-sourcemaps'),
	rigger = require('gulp-rigger'),
	cssmin = require('gulp-cssmin'),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	rimraf = require('rimraf'),
	browserSync = require("browser-sync"),
	spritesmith = require('gulp.spritesmith'),
	reload = browserSync.reload;

var onError = function (err) {
	notify.onError({
		title: "Gulp",
		subtitle: "Failure!",
		message: "Error: <%= error.message %>",
		sound: "Beep"
	})(err);

	this.emit('end');
};

var path = {
	build: { //Тут мы укажем куда складывать готовые после сборки файлы
		html: 'build/',
		js: 'build/js/',
		css: 'build/css/',
		img: 'build/img/',
		fonts: 'build/fonts/'
	},
	src: { //Пути откуда брать исходники
		html: 'src/*.html', //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html
		pug: 'src/views/pages/*.pug',
		js: 'src/js/main.js', //В стилях и скриптах нам понадобятся только main файлы
		style: 'src/style/main.less',
		img: 'src/img/**/*.*',
		spriteImg: 'src/sprite/**/*.*',
		spriteStyle: 'src/style/partials/',
		fonts: 'src/fonts/**/*.*'
	},
	watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
		// html: 'src/**/*.html',
		pug: 'src/**/*.pug',
		js: 'src/js/**/*.js',
		style: 'src/style/**/*.less',
		img: 'src/img/**/*.*',
		fonts: 'src/fonts/**/*.*'
	},
	clean: './build'
};


var config = {
	server: {
		baseDir: "./build"
	},
	// tunnel: true,
	host: 'localhost',
	port: 9000,
	logPrefix: "Frontend"
};


// gulp.task('html:build', function () {
// 	gulp.src(path.src.html) //Выберем файлы по нужному пути
// 		.pipe(rigger()) //Прогоним через rigger
// 		.pipe(gulp.dest(path.build.html)) //Выплюнем их в папку build
// 		.pipe(reload({
// 			stream: true
// 		})); //И перезагрузим наш сервер для обновлений
// });
gulp.task('html:build', function () {
	gulp.src(path.src.pug) //Выберем файлы по нужному пути
		.pipe(pug()) //Прогоним через rigger
		.pipe(gulp.dest(path.build.html)) //Выплюнем их в папку build
		.pipe(reload({
			stream: true
		})); //И перезагрузим наш сервер для обновлений
});
gulp.task('js:build', function () {
	gulp.src(path.src.js) //Найдем наш main файл
		.pipe(plumber({
			errorHandler: onError
		}))
		.pipe(rigger()) //Прогоним через rigger
		.pipe(sourcemaps.init()) //Инициализируем sourcemap
		.pipe(uglify()) //Сожмем наш js
		.pipe(sourcemaps.write()) //Пропишем карты
		.pipe(gulp.dest(path.build.js)) //Выплюнем готовый файл в build
		.pipe(reload({
			stream: true
		})); //И перезагрузим сервер
});


gulp.task('style:build', function () {
	gulp.src(path.src.style) //Выберем наш main.less
		.pipe(plumber({
			errorHandler: onError
		}))
		.pipe(sourcemaps.init()) //То же самое что и с js
		.pipe(less()) //Скомпилируем
		.pipe(prefixer({
			browsers: ['last 2 versions']
		})) //Добавим вендорные префиксы
		.pipe(cssmin()) //Сожмем
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.build.css)) //И в build
		.pipe(reload({
			stream: true
		})).pipe(notify("Стили впорядке"));

});

gulp.task('image:build', function () {
	 var spriteData =
       gulp.src(path.src.spriteImg) // путь, откуда берем картинки для спрайта
           .pipe(spritesmith({
               imgName: 'sprite.png',
			   imgPath : '/img/sprite.png',
               cssName: 'sprite.less',
               cssFormat: 'less',
               algorithm: 'binary-tree',
               cssVarMap: function(sprite) {
                   sprite.name = 'sprite-' + sprite.name
               }
           }));

   spriteData.img.pipe(gulp.dest(path.build.img)); // путь, куда сохраняем картинку
   spriteData.css.pipe(gulp.dest(path.src.spriteStyle)); // путь, куда сохраняем стили

	gulp.src([path.src.img]) //Выберем наши картинки
		.pipe(imagemin({ //Сожмем их
			progressive: true,
			svgoPlugins: [{
				removeViewBox: false
			}],
			use: [pngquant()],
			interlaced: true
		}))
		.pipe(gulp.dest(path.build.img)) //И бросим в build
		.pipe(reload({
			stream: true
		}));
});



gulp.task('fonts:build', function () {
	gulp.src(path.src.fonts)
		.pipe(gulp.dest(path.build.fonts));
});

gulp.task('build', [
    'html:build',
    'js:build',
    'fonts:build',
    'image:build',
	'style:build'
]);

gulp.task('watch', function () {
	watch([path.watch.pug], function (event, cb) {
		gulp.start('html:build');
	});
	watch([path.watch.style], function (event, cb) {
		gulp.start('style:build');
	});
	watch([path.watch.js], function (event, cb) {
		gulp.start('js:build');
	});
	watch([path.watch.img], function (event, cb) {
		gulp.start('image:build');
	});
	watch([path.watch.fonts], function (event, cb) {
		gulp.start('fonts:build');
	});
});

gulp.task('webserver', function () {
	browserSync(config);
});

gulp.task('clean', function (cb) {
	rimraf(path.clean, cb);
});

gulp.task('default', ['build', 'webserver', 'watch']);
