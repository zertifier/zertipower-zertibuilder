import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { InvalidArgumentError } from "../../../domain/error/common";
import * as handlebars from "handlebars";
import { EnvironmentService } from "../environment-service";

/**
 * This service implements {@link ViewsService} with handlebars engine.
 */
@Injectable()
export class HandlebarsViewsService {
  readonly views: { [key: string]: string } = {};
  readonly templates: { [name: string]: HandlebarsTemplateDelegate } = {};
  private viewsFolder = this.environment.getEnv().VIEWS_FOLDER;
  private engine = handlebars;

  constructor(private environment: EnvironmentService) {
    if (!fs.existsSync(this.viewsFolder)) {
      throw new InvalidArgumentError(
        `Views folder does not exist: ${this.viewsFolder}`
      );
    }
  }

  async compileAndRender(templateContent: string, data: any) {
    const template = handlebars.compile(templateContent);
    return template(data);
  }

  async renderView(viewName: string, content: any): Promise<string> {
    let template = this.templates[viewName];
    if (!template) {
      const view = this.getView(viewName);
      template = this.engine.compile(view);
    }

    return template(content);
  }

  private getView(viewName: string): string {
    const viewPath = viewName.split("/");

    let viewContent: string = this.views[viewName];
    if (viewContent) {
      return viewContent;
    }

    viewContent = fs
      .readFileSync(path.join(this.viewsFolder, ...viewPath))
      .toString();
    this.views[viewName] = viewContent;
    return viewContent;
  }
}
