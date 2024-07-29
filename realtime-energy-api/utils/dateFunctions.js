const moment = require('moment');

function getDateLimits(date,dateFormat){
    let startDate, endDate;
    switch (dateFormat) {
        case 'hourly':
            startDate = moment(date).startOf('hour').format('YYYY-MM-DD HH:mm:ss');
            endDate = moment(date).endOf('hour').format('YYYY-MM-DD HH:mm:ss');
            break;
        case 'daily':
            startDate = moment(date).startOf('day').format('YYYY-MM-DD HH:mm:ss');
            endDate = moment(date).endOf('day').format('YYYY-MM-DD HH:mm:ss');
            break;
        case 'weekly':
            startDate = moment(date).startOf('week').format('YYYY-MM-DD HH:mm:ss');
            endDate = moment(date).endOf('week').format('YYYY-MM-DD HH:mm:ss');
            break;
        case 'yearly':
            startDate = moment(date).startOf('year').format('YYYY-MM-DD HH:mm:ss');
            endDate = moment(date).endOf('year').format('YYYY-MM-DD HH:mm:ss');
            break;
        default:
            throw new Error('Invalid date format')
    }
    return {startDate,endDate}
}

module.exports = {
    getDateLimits
}