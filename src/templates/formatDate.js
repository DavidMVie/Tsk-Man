const moment = require('moment');

module.exports = function(date, type) {

  if(type === 'dueDate') {
    return date ? moment(date).format('Do MMM YYYY') : null
  }

  if(type === 'timeTo') {    
    return date ? moment().to(moment(date)) : null
  }
}

