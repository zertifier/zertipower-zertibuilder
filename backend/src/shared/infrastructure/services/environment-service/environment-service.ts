import { Injectable, OnModuleInit } from "@nestjs/common";
import { config } from "dotenv";
import { TypeUtils } from "../../../domain/utils";
import { EnvVariables } from "./env-variables";
import * as envSchema from "./env-schema.json";
import { EnvVariable } from "./environment-variables-definition";

/**
 * It handles the .env file parsing. Ensuring that the environment variables
 * defined in {@link EnvVariables} are correctly parsed
 */
@Injectable()
export class EnvironmentService implements OnModuleInit {
  parsed = false;
  private readonly environmentVariables: EnvVariables = {
    APPLICATION_NAME: "",
    SMTP_PASSWORD: "",
    SMTP_PORT: 0,
    SMTP_SERVER: "",
    SMTP_USER: "",
    VIEWS_FOLDER: "",
    PORT: 0,
    JWT_SECRET: "",
    DATABASE_URL: "",
    // DATABASE_URL: "",
    FRONTEND_URL: "",
    GOOGLE_CLIENT_SECRET: "",
    GOOGLE_CLIENT_ID: "",
    RADIATION_API: "",
  };

  onModuleInit(): any {
    if (process.env.NODE_ENV === "development") {
      config();
    }
  }

  getEnv() {
    if (this.parsed) {
      return this.environmentVariables;
    }

    const variables = envSchema.vars as any as EnvVariable[];
    for (const variable of variables) {
      const envValue = process.env[variable.name];
      if (!envValue) {
        if (variable.default === undefined && variable.required) {
          throw new Error(
            `Environment variable '${variable.name}' is not defined and it is required`
          );
        }
        (this.environmentVariables as any)[variable.name] = variable.default;
        continue;
      }
      if (variable.type === "float") {
        const parsedValue = parseFloat(envValue);
        if (!parsedValue) {
          throw new Error(
            `Environment variable ${variable.name} must be a number`
          );
        }

        // rome-ignore lint: wee need to use explicit any. But is in a known situation
        (this.environmentVariables as any)[variable.name] = parsedValue;
        continue;
      }
      if (variable.type === "int") {
        const parsedValue = parseInt(envValue);
        if (!parsedValue) {
          throw new Error(
            `Environment variable ${variable.name} must be an integer`
          );
        }

        // rome-ignore lint: wee need to use explicit any. But is in a known situation
        (this.environmentVariables as any)[variable.name] = parsedValue;
      }
      if (variable.type === "bool") {
        let parsedValue: boolean;
        try {
          parsedValue = TypeUtils.parseBoolean(envValue);
        } catch (err) {
          throw new Error(`Env variable is not a valid boolean: ${err}`);
        }
        if (!parsedValue) {
          throw new Error(
            `Environment variable ${variable.name} must be an integer`
          );
        }
        // rome-ignore lint: wee need to use explicit any. But is in a known situation
        (this.environmentVariables as any)[variable.name] = parsedValue;
      }
      // rome-ignore lint: wee need to use explicit any. But is in a known situation
      (this.environmentVariables as any)[variable.name] = envValue;
    }

    this.parsed = true;
    return this.environmentVariables;
  }
}
