import Swal from "sweetalert2";

export function Confirmable(message: string): MethodDecorator {
	return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: any[]) {
			const response = await Swal.fire({
				icon: "question",
				title: "",
				text: message,
				showCancelButton: true,
			});

			if (!response.isConfirmed) {
				return;
			}

			return originalMethod.apply(this, args);
		};

		return descriptor;
	};
}
