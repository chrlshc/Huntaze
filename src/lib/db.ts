// Re-export database utilities from the primary lib implementation's barrel.
// Using the index ensures both named (query, getClient, getPool, db)
// and default exports are available at the alias path `@/lib/db`.
export * from '../../lib/db/index';
export { default } from '../../lib/db/index';
