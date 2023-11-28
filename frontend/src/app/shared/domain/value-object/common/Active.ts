import { BooleanValueObject } from "../BooleanValueObject";

export class Active extends BooleanValueObject {
	public static activated(): Active {
		return new Active(true);
	}

	public static deactivated(): Active {
		return new Active(false);
	}
}
