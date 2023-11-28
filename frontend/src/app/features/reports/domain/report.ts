export interface Report {
	id?: number;
	name: string;
	sql: string;
	columns: Array<{ name: string; size: number }>;
	params: Array<{ name: string; type: string }>;
	createdAt?: string;
	updatedAt?: string;
}
