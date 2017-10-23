var serve = require('metalsmith-serve');
var watch = require('metalsmith-watch');
var ms = require('./metalsmith.js').ms;

ms.use(watch({
    paths: {
        "./*": true,
        "${source}/**/*": true,
        "../layouts/**/*": true,
    },
    livereload: true,
})).use(serve({
    port: 3000
})).build(err => {
    if (err) {
        throw err;
    }
});
