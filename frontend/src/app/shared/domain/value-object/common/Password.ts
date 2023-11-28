import { StringValueObject } from "../StringValueObject";
import zxcvbn from "zxcvbn";
import CryptoJS from "crypto-js";

export class Password extends StringValueObject {
	static readonly NONE_PASSWORD_VALUE = "Accommodation Extravagance Phenomenology Antithetical";

	constructor(value: string) {
		super(value);
		this.ensurePasswordMatchRequirements(value);
	}

	/**
	 * Creates a default empty password. Creates a default password that match de default password requirements.
	 *
	 * This default password will be used as an empty password.
	 */
	public static none(): Password {
		return new Password(Password.NONE_PASSWORD_VALUE);
	}

	/**
	 * Creates a random password
	 */
	public static random(): Password {
		const PASSWORD_LENGTH = 10;
		const randomString = (Math.random() + 1).toString(16).slice(-7);
		const md5Hash = CryptoJS.MD5(randomString).toString();

		return new Password(md5Hash.slice(-PASSWORD_LENGTH));
	}

	private ensurePasswordMatchRequirements(value: string) {
		const result = zxcvbn(value);
		if (result.score < 2) {
			throw new Error(`Password is to weak strength punctuation ${result.score}`);
		}
	}
}
