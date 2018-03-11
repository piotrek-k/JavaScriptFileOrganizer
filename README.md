Creating global link to this package
https://docs.npmjs.com/cli/link

Example usage in gulp:

```
var gulp = require('gulp');
var js_organizer = require('js-scripts-organizer'); //this is package from this repo
var path = require('path');

gulp.task('ensure_view_has_js', function (done) {
    js_organizer.ensure_every_view_has_javascript(path.join(__dirname, "./Views"), path.join(__dirname, "./Scripts"));
    done();
});

gulp.task('build_to_development', function (done) {
    js_organizer.copy_to_wwwroot_wrap_in_containers(path.join(__dirname, "./Scripts"), path.join(__dirname, "./wwwroot/development"), path.join(__dirname, "./JS_Templates/container.js"));
    done();
});

gulp.task('prepare-js', gulp.series('ensure_view_has_js', 'build_to_development'));
```

Tasks:

- [x] ensure every View has Script
- [x] wrap Scripts in containers
- [ ] generate variables pointing to html objects
- [ ] generate services to allow communication between components