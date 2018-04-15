let concat = require('gulp-concat');
let gulp = require('gulp');
let uglify = require('gulp-uglify');

let jsFiles = [
        'src/*.js',
        'src/morphs/*.js'
    ],
    jsDest = 'dist/';

gulp.task('scripts', function () {
    return gulp.src(jsFiles)
        .pipe(concat('morphic.js'))
        .pipe(gulp.dest(jsDest))
        .pipe(concat('morphic.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(jsDest));
});
