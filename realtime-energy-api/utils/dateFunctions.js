const moment = require('moment');

function getDateLimits(date,dateFormat){
    let startDate, endDate;
    switch (dateFormat) {
        case 'hourly':
            startDate = moment(date,'DD/MM/YYYY').startOf('hour').format('YYYY-MM-DD HH:mm:ss');
            endDate = moment(date,'DD/MM/YYYY').endOf('hour').format('YYYY-MM-DD HH:mm:ss');
            break;
        case 'daily':
            startDate = moment(date,'DD/MM/YYYY').startOf('day').format('YYYY-MM-DD HH:mm:ss');
            endDate = moment(date,'DD/MM/YYYY').endOf('day').format('YYYY-MM-DD HH:mm:ss');
            break;
        case 'weekly':
            startDate = moment(date,'DD/MM/YYYY').startOf('week').format('YYYY-MM-DD HH:mm:ss');
            endDate = moment(date,'DD/MM/YYYY').endOf('week').format('YYYY-MM-DD HH:mm:ss');
            break;
        case 'monthly':
        startDate = moment(date,'DD/MM/YYYY').startOf('month').format('YYYY-MM-DD HH:mm:ss');
        endDate = moment(date,'DD/MM/YYYY').endOf('month').format('YYYY-MM-DD HH:mm:ss');
        break;
        case 'yearly':
            startDate = moment(date,'DD/MM/YYYY').startOf('year').format('YYYY-MM-DD HH:mm:ss');
            endDate = moment(date,'DD/MM/YYYY').endOf('year').format('YYYY-MM-DD HH:mm:ss');
            break;
        default:
            throw new Error('Invalid date format')
    }
    return {startDate,endDate}
}

module.exports = {
    getDateLimits
}