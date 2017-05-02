var gulp = require('gulp');//首先安装gulp模块
var browserSync = require('browser-sync').create();//省时的浏览器同步测试工具
var less        = require('gulp-less');//less转CSS
var reload      = browserSync.reload;//页面强制刷新
var notify      = require('gulp-notify');//提示
var concat      = require('gulp-concat');//合并
var cleancss    =require('gulp-clean-css');//CSS压缩
var rev         =require('gulp-rev');//版本控制
var revCollector=require('gulp-rev-collector');//路径修改
var runSequence =require('run-sequence');//同步异步处理
var del         =require('del');//删除
// var vinylPaths  =require('vinyl-paths');//删除管道
var base64      =require('gulp-base64');//图片64位处理
var fs          =require('fs');//引入的一个node模块
var imagemin    =require('gulp-imagemin');//压缩图片
// var spriter     =require('gulp-css-spriter');//雪碧图操作（在这里面具体的）

var babel       =require('gulp-babel');//6转5
var uglify      =require('gulp-uglify')//js压缩
var rename      =require('gulp-rename')//改名字
// var changed     =require('gulp-changed')//只编译修改过的文件

var build = {
    images:'./build/images/',
    js:'./build/js/'
}

var src = {
    images:'./src/images/',
    js:'./src/js/'
}

/**js操作流
 * 
 * 两个js的合并
 * 对合并后的js进行6-5的转码
 */
 gulp.task('js',function(){
     gulp.src([src.js+'a.js','./src/js/b.js'])
        .pipe(concat('index.js'))
        .pipe(gulp.dest('./src/js'))

     gulp.src('./src/js/index.js')
        .pipe(babel({
            presets:['es2015']
        }))   
        .pipe(uglify())
        .pipe(rename('./index.min.js'))
        //注意这里的路径，相对于它./src/js/index.js的路径改动
        .pipe(gulp.dest('./build/js'))
 })   

/**删除操作流
 * 
 * 可手动删除,控制台上输入：gulp del:clean即可
 */
gulp.task('clean',function(){
    del([
        './build/',
        './rev/'
        ]);
})

/**css操作流
 * 
 * less转css
 * 转换后的css合并为一个
 * 雪碧图
 * 图片base64处理
 * css压缩
 * css版本控制
 * 生成一个rev-manifest的json数据集文件
 */
gulp.task('css',function(){
 gulp.src('./src/css/*.less')
        .pipe(less())
        .pipe(gulp.dest('./src/css'))
        .pipe(reload({stream: true}))

    gulp.src(['./src/css/main.css','./src/css/header.css'])
        .pipe(concat('index.css'))

        // 雪碧图操作
        // .pipe(spriter({
        //     'spriteSheet': './build/images/spritesheet.png',
        //     'pathToSpriteSheetFromCSS': '../images/spritesheet.png'
        // }))

        // .pipe(base64())//或者是下面
        .pipe(base64({
                    maxImageSize:2*1024,//超过200就64位，否则正常状态
                    debug:true
                }))
        
        // .pipe(cleancss())//css压缩
        .pipe(rev())//版本控制
        .pipe(gulp.dest('./build/css'))
        
        // .pipe(gulp.dest('./dist/css'))//这是什么？？？目前不知道原因
        .pipe(rev.manifest())//生成一个rev-manifest的json文件
        .pipe(gulp.dest('./rev'))
     
        .pipe(reload({stream: true}))
        .pipe(notify("合并css-->CSS <%= file.relative %>!"))
})



/**images操作流
 * 
 * images压缩
 */
gulp.task('images',function(){
    gulp.src('./src/images/*.*')
        .pipe(imagemin())//进行图片的压缩
        .pipe(gulp.dest('./build/images/'))
})

/**images操作流
 * 
 * 测试是否存在rev-manifest.json文件
 */
gulp.task('temp',function(){
    fs.exists('./rev/rev-manifest.json',function(aaa){
        console.log(aaa);
    })
})

/**html操作流
 * 
 * 判断是否存在.json文件
 * 在发布的build的html页面加上link的字符集引入,覆盖之前的html
 */
gulp.task('html',function(){
    fs.exists('./rev/rev-manifest.json',function(aaa){
        if(aaa === true){
            gulp.src(['./rev/*.json','./src/*.html'])
                // .pipe(changed('./src/*.html'))
                .pipe(revCollector())//路径修改
                .pipe(gulp.dest('./build/'))
                .pipe(reload({stream: true}))
                .pipe(notify("html文件更新完成<%= file.relative %>!"));
        }else{
            console.log("nothing://rev-manifest.json")
            //控制台上可以发现一直在找上面判断的文件
            runSequence('html')//注释
        }
    })
})

/**default操作流
 * 
 *
 */

// 静态服务器 + 监听 less/html  文件
gulp.task('default',function() {
    // runSequence('images','css','html')
    runSequence('images','css','js','html')
    browserSync.init({
        server: {
        	baseDir:"./build/"
        },
        port:"3000"
    });
    gulp.watch("src/css/*.less", ['images','css','html']);
    gulp.watch("src/!(_)*.html",['html']);
    gulp.watch("src/*.js",['js']);
    //注意：./src代表当前目录，但是如果watch前面目录加上./的话，不会监听到新增加的文件
});
