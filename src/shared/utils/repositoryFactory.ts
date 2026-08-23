import DatabaseConfig from "@/config/database";
import { entities } from "@/database/models";

/** Repository lookup for the active store-scoped entity set. */
export function getRepositoryMap() {
  return Object.fromEntries(entities.map((entity: any) => [entity.name, DatabaseConfig.getRepository(entity)]));
}

export function getRepositoryByName(name: string) {
  const entity = (entities as any[]).find((candidate) => candidate.name === name);
  return entity ? DatabaseConfig.getRepository(entity) : undefined;
}

export const RepositoryFactory = {
  getRepositories: getRepositoryMap,
};
