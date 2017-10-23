module.exports = function(path, options) {
    console.log(path, options);
    return path.name === 'index'? path.dir : path.dir + '/' + path.name;
};
