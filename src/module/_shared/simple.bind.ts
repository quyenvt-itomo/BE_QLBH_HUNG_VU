import { ContainerModule } from "inversify";

export function createSimpleModule(
  tokens: any,
  Repository: any,
  Service: any,
  Controller: any,
  Router: any,
): ContainerModule {
  return new ContainerModule((bind) => {
    bind(tokens.Repository).toDynamicValue(() => new Repository()).inSingletonScope();
    bind(tokens.Service)
      .toDynamicValue((context) => new Service(context.container.get(tokens.Repository)))
      .inSingletonScope();
    bind(tokens.Controller)
      .toDynamicValue((context) => new Controller(context.container.get(tokens.Service)))
      .inSingletonScope();
    bind(tokens.Router)
      .toDynamicValue((context) => new Router(context.container.get(tokens.Controller)))
      .inSingletonScope();
  });
}
