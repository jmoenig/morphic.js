let concat = require('gulp-concat');
let gulp = require('gulp');
let sourcemaps = require('gulp-sourcemaps');
let uglify = require('gulp-uglify');

let jsFiles = [
        'src/settings.js',
        'src/functions.js',
        'src/retina.js',
        'src/animations.js',
        'src/colors.js',
        'src/points.js',
        'src/rectangle.js',
        'src/node.js',
        'src/morphs/morph.js',
        'src/morphs/pen.js',
        'src/morphs/colorpalette.js',
        'src/morphs/graypalette.js',
        'src/morphs/colorpicker.js',
        'src/morphs/blinker.js',
        'src/morphs/cursor.js',
        'src/morphs/box.js',
        'src/morphs/speechbubble.js',
        'src/morphs/dial.js',
        'src/morphs/circlebox.js',
        'src/morphs/sliderbutton.js',
        'src/morphs/slider.js',
        'src/morphs/mousesensor.js',
        'src/morphs/inspector.js',
        'src/morphs/menu.js',
        'src/morphs/string.js',
        'src/morphs/text.js',
        'src/morphs/trigger.js',
        'src/morphs/menuitem.js',
        'src/morphs/frame.js',
        'src/morphs/scrollframe.js',
        'src/morphs/list.js',
        'src/morphs/stringfield.js',
        'src/morphs/bouncer.js',
        'src/morphs/hand.js',
        'src/morphs/world.js',
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
    gulp.watch(['src/**/*.js'], ['scripts'])
});
