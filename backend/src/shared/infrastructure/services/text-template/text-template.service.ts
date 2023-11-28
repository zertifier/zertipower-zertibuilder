import { Injectable } from '@nestjs/common';

@Injectable()
export class TextTemplateService {
  private readonly inlineVariableRegex = /{{\s+?[\w\w-]+\s+?}}/g;

  parse(template: string, variables: any) {
    let parsedTemplate = template;
    const match = template.match(this.inlineVariableRegex);
    if (!match) {
      return parsedTemplate;
    }

    for (const variable of match) {
      const variableName = variable.replaceAll(/({{\s+?)|(\s+?}})/g, '');
      const value = variables[variableName];
      parsedTemplate = parsedTemplate.replace(variable, value.toString());
    }

    return parsedTemplate;
  }
}
