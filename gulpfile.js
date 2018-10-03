const gulp = require('gulp');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const solidityABI = require('gulp-solidity-abi');
const purify = require('gulp-purifycss');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const browserSync = require('browser-sync').create();
const minify = require('gulp-minify');

gulp.task('copy-address', function () {
  return gulp.src('ether-loto-contract/build/1_contract_address.js')
    .pipe(gulp.dest('src/js'));
});

gulp.task('html', function () {
  return gulp.src('src/index.html')
    .pipe(gulp.dest('build'));
});

gulp.task('extract-abi', function () {
  return gulp.src('ether-loto-contract/build/contracts/EtherLoto.json')
    .pipe(solidityABI())
    .pipe(rename('2_abi.js'))
    .pipe(gulp.dest('src/js/'))
});

gulp.task('js-dev', function () {
  return gulp.src(['bower_components/jquery/dist/jquery.slim.js',
      'bower_components/web3/dist/web3.js',
      'bower_components/utf8/utf8.js',
      'src/js/*.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(concat('app.min.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/js'));
});

gulp.task('js-deploy', function () {
  return gulp.src(['bower_components/jquery/dist/jquery.slim.min.js',
      'bower_components/web3/dist/web3.min.js',
      'bower_components/utf8/utf8.js',
      'ether-loto-contract/build/contracts/EtherLoto.json',
      'src/js/*.js'
    ])
    .pipe(solidityABI())
    .pipe(concat('app.min.js'))
    .pipe(minify({
      ext: {
        min: '.js',
        src: ''
      },
      noSource: true,
      mangle: false
    }))
    .pipe(gulp.dest('build/js'));
});

gulp.task('css', function () {
  return gulp.src(['bower_components/bootstrap/dist/css/bootstrap.css', 'src/css/*.css'])
    .pipe(concat('app.min.css'))
    .pipe(purify(['src/js/*.js', 'src/index.html']))
    .pipe(cleanCSS({
      compatibility: 'ie8'
    }))
    .pipe(gulp.dest('build/css'));
});

gulp.task('dev', gulp.parallel('html', 'js-dev', 'css'));

gulp.task('dev-contract', gulp.series('copy-address', 'dev'));

gulp.task('deploy', gulp.parallel('html', 'js-deploy', 'css'));

// Static Server + watching scss/html files
gulp.task('serve', gulp.series('dev', function () {
  browserSync.init({
    server: "./build"
  });

  gulp.watch(['src/**/*', '!src/js/2_abi.js', 'build/contracts/EtherLoto.json'], gulp.series('dev')).on('change', browserSync.reload);
}));

// Static Server + watching scss/html files
gulp.task('serve-full', gulp.series('dev-contract', function () {
  browserSync.init({
    server: "./build"
  });

  gulp.watch(['src/**/*', '!src/js/2_abi.js', 'build/contracts/EtherLoto.json'], gulp.series('dev')).on('change', browserSync.reload);
}));

gulp.task('default', gulp.series('serve'));