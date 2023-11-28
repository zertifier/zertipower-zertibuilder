/**
 * Environment variable definition used to parse .env entries
 */
export interface EnvVariable {
  type: 'string' | 'int' | 'float' | 'bool';
  default?: string;
  name: string;
  required: boolean;
}
