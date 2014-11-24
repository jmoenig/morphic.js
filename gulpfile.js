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
    'src/morphs.js',
    'src/shadow-morph.js',
    'src/handle-morph.js',
    'src/pen-morph.js',
    'src/color-palette-morph.js',
    'src/gray-palette-morph.js',
    'src/color-picker-morph.js',
    'src/blinker-morph.js',
    'src/cursor-morph.js',
    'src/box-morph.js',
    'src/speech-bubble-morph.js',
    'src/circle-box-morph.js',
    'src/todo.js'
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
