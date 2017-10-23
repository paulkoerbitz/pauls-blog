var ms = require('./metalsmith.js').ms;

ms.build(err => {
    if (err) {
        throw err;
    }
});