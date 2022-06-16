//list dependences

const gulp = require('gulp');
const {src, dest, watch, series} = require('gulp') ;
const sass = require('gulp-sass')(require('node-sass'));
const prefix = require('gulp-autoprefixer')
const minify = require('gulp-clean-css')
const imagemin = require('gulp-imagemin')
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify') ;
const rename = require("gulp-rename");
var browsersync = require('browser-sync').create();
var nunjucksRender = require('gulp-nunjucks-render');
const include = require('gulp-include');

const node_modules_folder = './node_modules/'
const  node_dependencies = Object.keys(require('./package.json').dependencies || {});


// html
function htmlTask(){
  return gulp.src('themes/custom/my-project/src/html/*.html')
  .pipe(nunjucksRender({
    path: ['themes/custom/my-project/src/html/'] 
  }))
  .pipe(gulp.dest('themes/custom/my-project/dist/'));
}

// scss
function compilescss(){
  return src([
  'themes/custom/my-project/src/scss/styles.scss'])
  .pipe(sourcemaps.init())
  .pipe(sass(
    {
      includePaths: [node_modules_folder]
    }
  ))
  .pipe(prefix())   
  .pipe(minify())
  .pipe(rename('styles.min.css'))  
  .pipe(sourcemaps.write('.')) 
  .pipe(dest('themes/custom/my-project/dist/assets/stylesheets'))  
}

// js
function jsmin(){
  return src('themes/custom/my-project/src/js/*.js')    
  .pipe(include({    
    includePaths: [
      node_modules_folder
    ]
  }))
  .pipe(uglify()) 
  .pipe(rename({
    suffix: '.min'
  }))
  .pipe(dest('themes/custom/my-project/dist/assets/js'))
}

// node dependency
function nodePackages(){ 
  var reduced = node_dependencies.reduce(function(filtered, dependency) {
    if (require(node_modules_folder + dependency+'/package.json')["main"] ) {       
       filtered.push(node_modules_folder + dependency+"/"+ (require(node_modules_folder + dependency+'/package.json')["main"] ).replace('./', ''));
    }
    return filtered;
  }, []);
  return src(reduced, {   
    since: gulp.lastRun(nodePackages)
  })
  .pipe(uglify()) 
  .pipe(rename(function(opt) {
    if(!opt.basename.endsWith('.min')){
      opt.basename=opt.basename+'.min'
    }
    return opt;       
  }))
  .pipe(dest('themes/custom/my-project/dist/assets/js/modules')) 
}

// images
function optimizeimg(){
  return src('themes/custom/my-project/src/images/*')
  .pipe(imagemin())
  .pipe(dest('themes/custom/my-project/dist/assets/images'))
}
 
// create watchtask
function watchTask() {
  browsersync.init({
    server: './themes/custom/my-project/dist/'
  });
  watch(['themes/custom/my-project/src/scss/*.scss', 'themes/custom/my-project/src/scss/import/**/*.scss'],compilescss).on('change', browsersync.reload);
  watch('themes/custom/my-project/src/js/*.js',jsmin).on('change', browsersync.reload);
  watch('themes/custom/my-project/src/images/*',optimizeimg).on('change', browsersync.reload); 
  watch('themes/custom/my-project/src/images/*',nodePackages).on('change', browsersync.reload);     
  watch(['themes/custom/my-project/src/html/*.html','themes/custom/my-project/src/html/**/*.html'],htmlTask).on('change', browsersync.reload);     
}

exports.default = series(
  jsmin,
  compilescss, 
  optimizeimg,
  htmlTask,
  nodePackages, 
  watchTask,  
)
