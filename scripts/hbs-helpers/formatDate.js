var moment = require('moment');

module.exports = (date, options) => {
    return moment(date).format("MMMM Do, YYYY");
};
