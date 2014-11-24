var gulp = require('gulp');
var header = require('gulp-header');
var footer = require('gulp-footer');
var rename = require('gulp-rename');
var concat = require('gulp-concat');

var scripts = [
    'src/doc.js',
    'src/settings.js',
    'src/utils.js',
    'src/colors.js',
    'src/points.js',
    'src/rectangles.js',
    'src/nodes.js',
    'src/morph/morph.js',
    'src/morph/shadow-morph.js',
    'src/morph/handle-morph.js',
    'src/morph/pen-morph.js',
    'src/morph/color-palette-morph.js',
    'src/morph/gray-palette-morph.js',
    'src/morph/color-picker-morph.js',
    'src/morph/blinker-morph.js',
    'src/morph/cursor-morph.js',
    'src/morph/box-morph.js',
    'src/morph/speech-bubble-morph.js',
    'src/morph/circle-box-morph.js',
    'src/morph/color-picker-morph.js',
    'src/morph/gray-palette-morph.js',
    'src/morph/slider-button-morph.js',
    'src/morph/slider-morph.js',
    'src/morph/mouse-sensor-morph.js',
    'src/morph/inspector-morph.js',
    'src/morph/menu-morph.js',
    'src/morph/string-morph.js',
    'src/morph/text-morph.js',
    'src/morph/trigger-morph.js',
    'src/morph/menu-item-morph.js',
    'src/morph/frame-morph.js',
    'src/morph/scroll-frame-morph.js',
    'src/morph/list-morph.js',
    'src/morph/string-field-morph.js',
    'src/morph/bouncer-morph.js',
    'src/morph/hand-morph.js',
    'src/morph/world-morph.js'
];

gulp.task('intro', function(){
    // Convert morphic.txt in src/doc.js
    return gulp.src('morphic.txt')
    .pipe(header('/*'))
    .pipe(footer('*/'))
    .pipe(rename('doc.js'))
    .pipe(gulp.dest('src'));
});

gulp.task('scripts', ['intro'], function(){
    // Concat JavaScript
    return gulp.src(scripts)
    .pipe(concat('morphic.js'))
    .pipe(gulp.dest('.'));
});

// Rerun the task when a file changes
gulp.task('watch', function(){
    gulp.watch(scripts, ['scripts']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'scripts']);
