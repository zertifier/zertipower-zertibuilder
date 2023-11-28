import { ValueObject } from './ValueObject';
import * as moment from 'moment';

export class DateValueObject extends ValueObject<Date> {
  constructor(value: Date) {
    super(value);
  }

  toUtcDateTimeString() {
    return moment(this.value).utc().format('YYYY-MM-DD HH:mm');
  }
  toUtcDateString() {
    return moment(this.value).utc().format('YYYY-MM-DD');
  }
  toUtcTimeString() {
    return moment(this.value).utc().format('HH:mm');
  }
}
