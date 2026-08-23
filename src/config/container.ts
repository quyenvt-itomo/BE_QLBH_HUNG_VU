import { Container } from "inversify";

/**
 * The store-scoped model uses repository-per-request routes and no longer
 * registers the removed company module tree in a global container.
 */
export const container = new Container();
