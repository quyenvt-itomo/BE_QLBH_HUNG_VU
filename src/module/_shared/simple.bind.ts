import { Container } from "inversify";

export function bindSimpleModule(container: Container, tokens: any, Repository: any, Service: any, Controller: any, Router: any): void {
  container.bind(tokens.Repository).toDynamicValue(() => new Repository()).inSingletonScope();
  container.bind(tokens.Service).toDynamicValue((context) => new Service(context.container.get(tokens.Repository))).inSingletonScope();
  container.bind(tokens.Controller).toDynamicValue((context) => new Controller(context.container.get(tokens.Service))).inSingletonScope();
  container.bind(tokens.Router).toDynamicValue((context) => new Router(context.container.get(tokens.Controller))).inSingletonScope();
}
