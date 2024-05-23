export interface HttpResponse<T> {
	message: string;
	data: T;
	error_code?: string;
}
