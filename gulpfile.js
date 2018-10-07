const del = require('del');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const pug = require('gulp-pug');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const less = require('gulp-less');
const autoprefixer = require('gulp-autoprefixer');
const gcmq = require('gulp-group-css-media-queries');
const csscomb = require('gulp-csscomb');
const cssmin = require('gulp-cssmin');
const coffee = require('gulp-coffee');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const connect = require('gulp-connect');
const emitty = require('emitty').setup('src/pug', 'pug', {makeVinylFile: true});

gulp.task('clean', () =>
    del(['./build'])
);

gulp.task('copy-img', () =>
    gulp.src('./src/img/**/*.{jpg,png,svg}')
        .pipe(gulp.dest('./build/img/'))
);

gulp.task('copy-font', () =>
    gulp.src('./src/font/**/*.{eot,svg,woff,woff2,ttf}')
        .pipe(gulp.dest('./build/font/'))
);

gulp.task('copy-meta', () =>
    gulp.src('./src/meta/**/*.{png,xml,ico,json}')
        .pipe(gulp.dest('./build/meta/'))
);

gulp.task('copy-vendor', () =>
    gulp.src('./src/libs/vendor/**/*.*')
        .pipe(gulp.dest('./build/vendor/'))
);

gulp.task('copy-favicon', () =>
    gulp.src('./src/meta/favicon.ico')
        .pipe(gulp.dest('./build/'))
);

gulp.task('copy', gulp.series(
    'copy-img',
    'copy-font',
    'copy-meta',
    'copy-vendor',
    'copy-favicon'
    )
);

gulp.task('img-clean', () =>
    del(['./build/img'])
);


gulp.task('concat-js', () =>
    gulp.src('./src/libs/js/*.js')
        .pipe(sourcemaps.init())
        .pipe(concat('libs.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./build/js/'))
);

gulp.task('concat-css', () =>
    gulp.src('./src/libs/css/*.css')
        .pipe(sourcemaps.init())
        .pipe(concat('libs.css'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./build/css/'))
);

gulp.task('concat', gulp.series(
    'concat-js',
    'concat-css'
    )
);


gulp.task('cssmin', () =>
    gulp.src(['./build/css/*.css', '!./build/css/*.min.css'])
        .pipe(cssmin({
            keepSpecialComments: 0,
            showLog: true
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./build/css/'))
);


gulp.task('uglify', () =>
    gulp.src(['./build/js/*.js', '!./build/js/*.min.js'])
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./build/js/'))
);

gulp.task('imagemin', () =>
    gulp.src('./build/img/**/*.{jpg,png,svg}')
        .pipe(imagemin([
          imagemin.gifsicle({interlaced: true}),
          imagemin.jpegtran({progressive: true}),
          imagemin.optipng({optimizationLevel: 5})
        ]))
        .pipe(gulp.dest('./build/img/'))
);


gulp.task('scripts', () =>
    gulp.src('./src/coffee/**/*.coffee')
        .pipe(concat('script.coffee'))
        .pipe(sourcemaps.init())
        .pipe(coffee())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./build/js/'))
        .pipe(connect.reload())
);

gulp.task('scripts-dev', () =>
  gulp.src('./src/coffee/**/*.coffee')
    .pipe(concat('script.coffee'))
    .pipe(coffee())
    .pipe(gulp.dest('./build/js/'))
    .pipe(connect.reload())
);

gulp.task('styles-dev', () =>
  gulp.src('./src/less/*.less')
    .pipe(less())
    .pipe(autoprefixer())
    .pipe(gcmq())
    .pipe(gulp.dest('./build/css/'))
    .pipe(connect.reload())
);

gulp.task('styles', () =>
    gulp.src('./src/less/*.less')
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(autoprefixer())
        .pipe(gcmq())
        .pipe(csscomb())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./build/css/'))
        .pipe(connect.reload())
);

gulp.task('watch', () => {

    gulp.watch('./src/less/**/*.less', gulp.series('styles'));
    gulp.watch('./src/coffee/**/*.coffee', gulp.series('scripts'));
    gulp.watch('./src/img/**/*.{jpg,png,svg}', gulp.series('img-clean','copy-img'));

    global.watch = true;

    gulp.watch('src/pug/**/*.pug', gulp.series('templates'))
        .on('all', (event, filepath) => {
            global.emittyChangedFile = filepath
        });

});

gulp.task('templates', () =>
    new Promise((resolve, reject) => {

        const sourceOptions = global.watch ? {read: false} : {};

        if (global.emittyChangedFile) {
            console.warn('Changes in ' + global.emittyChangedFile);
        }

        emitty.scan(global.emittyChangedFile).then(() => {
            gulp.src('src/pug/*.pug', sourceOptions)
                .pipe(gulpif(global.watch, emitty.filter(global.emittyChangedFile)))
                .pipe(pug({pretty: true}))
                .pipe(gulp.dest('build'))
                .pipe(connect.reload())
                .on('end', resolve)
                .on('error', reject);
        });
    })
);


gulp.task('connect', () =>
    connect.server({
        root: 'build',
        livereload: true
    })
);


gulp.task('default', gulp.series(
    'clean',
    'copy',
    'concat',
    'styles-dev',
    'scripts-dev',
    'templates',
    gulp.parallel(
        'watch',
        'connect'
    )
));

gulp.task('server', gulp.parallel(
    'watch',
    'connect'
));

gulp.task('build', gulp.series(
    'clean',
    'copy',
    'concat',
    'styles',
    'scripts',
    'templates',
    'uglify',
    'cssmin',
    'imagemin'
));
