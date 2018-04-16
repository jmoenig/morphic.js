let concat = require('gulp-concat');
let gulp = require('gulp');
let sourcemaps = require('gulp-sourcemaps');
let uglify = require('gulp-uglify');

let jsFiles = [
        'src/*.js',
        'src/morphs/*.js'
    ],
    jsDest = 'dist/';

gulp.task('scripts', function () {
    return gulp.src(jsFiles)
        .pipe(sourcemaps.init())
        .pipe(concat('morphic.js'))
        .pipe(gulp.dest(jsDest))
        .pipe(concat('morphic.min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(jsDest));
});

gulp.task('default', ['scripts']);

gulp.task('watch', function() {
    gulp.watch(['src/*.js', 'src/**/*.js'], ['scripts'])
});
