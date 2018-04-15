let gulp = require('gulp');
let concat = require('gulp-concat');
let deporder = require('gulp-deporder');
let rename = require('gulp-rename');
let uglify = require('gulp-uglify');

let jsFiles = ['src/*.js', 'src/morphs/*.js'],
    jsDest = 'dist/';

gulp.task('scripts', function() {
    return gulp.src(jsFiles)
        .pipe(deporder()) //ordering didn't work without number naming...
        .pipe(concat('morphic.js'))
        .pipe(gulp.dest(jsDest));
});