import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { InvalidArgumentError } from "../../../domain/error/common";
import * as Mustache from "mustache";
import { EnvironmentService } from "../environment-service";

/**
 * Service used to render templates
 */
@Injectable()
export class MustacheViewsService {
  readonly views: { [key: string]: string } = {};
  private viewsFolder = this.environment.getEnv().VIEWS_FOLDER;

  constructor(private environment: EnvironmentService) {
    if (!fs.existsSync(this.viewsFolder)) {
      throw new InvalidArgumentError(
        `Views folder does not exist: ${this.viewsFolder}`
      );
    }
  }

  async renderView(viewName: string, content: any): Promise<string> {
    const view = this.getView(viewName);
    return Mustache.render(view, content);
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
