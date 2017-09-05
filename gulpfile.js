const gulp = require('gulp');
const del = require('del');
//加载gulp-load-plugins插件，并马上运行它
const plugins = require('gulp-load-plugins')();

gulp.task('build', ['clean', 'cssMinify', 'jsConcatUglify']);

gulp.task('default', function () {
    console.log('gulp: hello world!');

    // 1. 使用gulp-load-plugins
    console.log(plugins);
});

gulp.task('clean', function () {
    return del([
        'dist/*'
    ]);
});

// 任务  - css文件压缩
gulp.task('cssMinify', function () {

    // css文件压缩 minifyCss
    gulp.src('src/css/*.css')   // 要压缩的css文件
        .pipe(plugins.minifyCss()) //使用minifyCss进行压缩
        .pipe(gulp.dest('dist/css')); // 压缩之后存放文件的路径
});

// 任务  -  js代码检查
gulp.task('jsLint', function () {
    gulp.src('src/js/**/*.js')
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter()); // 输出检查结果
});

// 任务 - js文件合并压缩
gulp.task("jsConcatUglify", function () {
    // 把src下js文件合并压缩为videoPlayer.js，输出到dist/js目录下
    gulp.src('src/js/**/*.js')
        // src(['src/js/lib/flv.min.js', 'src/js/lib/hls.min.js', 'src/js/lib/swfobject.js', 'src/js/videoPlayer.js'])
        .pipe(plugins.concat('videoPlayer.js')) // 合并
        .pipe(plugins.uglify()) // 压缩
        .pipe(gulp.dest('dist/js'));
})