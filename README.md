Creating global link to this package
https://docs.npmjs.com/cli/link

Example usage in gulp:

```
var gulp = require('gulp');
var js_organizer = require('js-scripts-organizer').init(__dirname); //this is package from this repo
var del = require('del');
var path = require('path');

gulp.task('clean:wwwroot-development-javascript', function () {
    return del([
        './wwwroot/development/**/*'
    ]);
});

gulp.task('watch:all', function (done) {
    gulp.watch('Scripts/**/*.js')
        .on('change', function (path, stats) {
            console.log('File ' + path + ' was changed');
        })
        .on('unlink', function (path) {
            console.log('File ' + path + ' was removed');
        });
});

gulp.task('ensure_view_has_js', function (done) {
    js_organizer.ensure_every_view_has_javascript("./development", "scriptObjectForHtml.html");
    done();
});

gulp.task('build_to_development', function (done) {
    js_organizer.copy_to_wwwroot_wrap_in_containers("./container.js");
    done();
});

gulp.task('prepare-js', gulp.series('clean:wwwroot-development-javascript', 'ensure_view_has_js', 'build_to_development'));
```

Tasks:

- [x] ensure every View has Script
- [x] wrap Scripts in containers
- [x] link to Scripts in every connected view
- [ ] generate variables pointing to html objects
- [ ] generate services to allow communication between components