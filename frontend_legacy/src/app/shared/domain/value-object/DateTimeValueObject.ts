import { ValueObject } from "./ValueObject";
import { environment } from "../../../../environments/environment";
import * as moment from "moment";

export class DateTimeValueObject extends ValueObject<Date> {
	public static now(): DateTimeValueObject {
		return new DateTimeValueObject(new Date());
	}

	public static fromDateTime(value: string): DateTimeValueObject {
		const date = moment(value, environment.datetime_format);
		if (!date.isValid()) {
			throw new Error(
				`Provided datetime is not valid it must be with the following format ${environment.datetime_format}`,
			);
		}
		return new DateTimeValueObject(date.toDate());
	}

	public static fromDate(value: string): DateTimeValueObject {
		const date = moment(value, environment.date_format);
		if (!date.isValid()) {
			throw new Error(
				`Provided date is not valid it must be with the following format ${environment.date_format}`,
			);
		}
		return new DateTimeValueObject(date.toDate());
	}

	public static fromTime(value: string): DateTimeValueObject {
		const date = moment(value, environment.time_format);
		if (!date.isValid()) {
			throw new Error(
				`Provided time is not valid it must be with the following format ${environment.time_format}`,
			);
		}
		return new DateTimeValueObject(date.toDate());
	}

	public static fromDateTimeUTC(value: string): DateTimeValueObject {
		const date = moment.utc(value, environment.datetime_format);
		if (!date.isValid()) {
			throw new Error(
				`Provided datetime is not valid it must be with the following format ${environment.datetime_format}`,
			);
		}
		return new DateTimeValueObject(date.toDate());
	}

	public static fromDateUTC(value: string): DateTimeValueObject {
		const date = moment.utc(value, environment.date_format);
		if (!date.isValid()) {
			throw new Error(
				`Provided date is not valid it must be with the following format ${environment.date_format}`,
			);
		}
		return new DateTimeValueObject(date.toDate());
	}

	public static fromTimeUTC(value: string): DateTimeValueObject {
		const date = moment.utc(value, environment.time_format);
		if (!date.isValid()) {
			throw new Error(
				`Provided time is not valid it must be with the following format ${environment.time_format}`,
			);
		}
		return new DateTimeValueObject(date.toDate());
	}

	public dateTimeFormat(): string {
		return moment(this.value).format(environment.datetime_format);
	}

	public dateFormat(): string {
		return moment(this.value).format(environment.date_format);
	}

	public timeFormat(): string {
		return moment(this.value).format(environment.time_format);
	}

	public dateTimeFormatUTC(): string {
		return moment(this.value).utc(false).format(environment.datetime_format);
	}

	public dateFormatUTC(): string {
		return moment(this.value).utc(false).format(environment.date_format);
	}

	public timeFormatUTC(): string {
		return moment(this.value).utc(false).format(environment.time_format);
	}
}
