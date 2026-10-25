import { readFileSync } from "node:fs";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";

export async function migrateDatabase(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("select pg_advisory_lock(87423512)");
    const registered = await client.query("select to_regclass('drizzle.__drizzle_migrations') as journal, to_regclass('public.users') as users");
    const history = registered.rows[0].journal ? (await client.query("select hash, created_at from drizzle.__drizzle_migrations order by created_at")).rows : [];
    const migrations = readMigrationFiles({ migrationsFolder: "drizzle" });
    for (const applied of history) {
      const expected = migrations.find(item => item.folderMillis === Number(applied.created_at));
      if (!expected || expected.hash !== applied.hash) throw new Error("数据库迁移登记与本地迁移文件不一致");
    }
    if (!history.length && registered.rows[0].users) {
      const baseline = JSON.parse(readFileSync("drizzle/meta/0000_snapshot.json", "utf8")) as {
        tables: Record<string, { name: string; columns: Record<string, { name: string; type: string; notNull: boolean; primaryKey: boolean }>;
          indexes: Record<string, { name: string; isUnique: boolean; method: string; columns: { expression: string }[] }>;
          foreignKeys: Record<string, { tableTo: string; columnsFrom: string[]; columnsTo: string[]; onDelete: string; onUpdate: string }> }>;
      };
      const columns = (await client.query("select c.relname as table_name, a.attname as column_name, a.attnotnull as not_null, format_type(a.atttypid, a.atttypmod) as type from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and a.attnum > 0 and not a.attisdropped")).rows;
      const indexes = (await client.query(`select c.relname as name, i.indisunique as unique, am.amname as method, pg_get_expr(i.indpred, i.indrelid) as predicate,
        array(select a.attname::text from unnest(i.indkey) with ordinality k(num, position) join pg_attribute a on a.attrelid=i.indrelid and a.attnum=k.num order by k.position) as columns
        from pg_index i join pg_class c on c.oid=i.indexrelid join pg_namespace n on n.oid=c.relnamespace join pg_am am on am.oid=c.relam where n.nspname='public'`)).rows;
      const constraints = (await client.query(`select c.contype as type, t.relname as table_name, r.relname as referenced_table, c.confdeltype as deletion, c.confupdtype as updating,
        array(select a.attname::text from unnest(c.conkey) with ordinality k(num, position) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.num order by k.position) as columns,
        array(select a.attname::text from unnest(c.confkey) with ordinality k(num, position) join pg_attribute a on a.attrelid=c.confrelid and a.attnum=k.num order by k.position) as referenced_columns
        from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace left join pg_class r on r.oid=c.confrelid
        where n.nspname='public' and c.contype in ('p','f')`)).rows;
      const actions: Record<string, string> = { "no action": "a", restrict: "r", cascade: "c", "set null": "n", "set default": "d" };
      for (const table of Object.values(baseline.tables)) {
        for (const column of Object.values(table.columns)) {
          const type = column.type.replace("varchar", "character varying").replace("timestamp", "timestamp without time zone").replaceAll(" ", "");
          if (!columns.some(row => row.table_name === table.name && row.column_name === column.name && row.type.replaceAll(" ", "") === type && (!column.notNull || row.not_null))) {
            throw new Error(`已有数据库与初始迁移不一致：${table.name}.${column.name}`);
          }
        }
        for (const index of Object.values(table.indexes)) {
          if (!indexes.some(row => row.name === index.name && row.unique === index.isUnique && row.method === index.method && row.predicate === null &&
            JSON.stringify(row.columns) === JSON.stringify(index.columns.map(column => column.expression)))) throw new Error(`已有数据库索引不一致：${index.name}`);
        }
        const primary = Object.values(table.columns).filter(column => column.primaryKey).map(column => column.name);
        if (!constraints.some(row => row.type === "p" && row.table_name === table.name && JSON.stringify(row.columns) === JSON.stringify(primary))) {
          throw new Error(`已有数据库主键不一致：${table.name}`);
        }
        for (const foreign of Object.values(table.foreignKeys)) {
          if (!constraints.some(row => row.type === "f" && row.table_name === table.name && row.referenced_table === foreign.tableTo &&
            row.deletion === actions[foreign.onDelete] && row.updating === actions[foreign.onUpdate] &&
            JSON.stringify(row.columns) === JSON.stringify(foreign.columnsFrom) && JSON.stringify(row.referenced_columns) === JSON.stringify(foreign.columnsTo))) {
            throw new Error(`已有数据库外键不一致：${table.name}.${foreign.columnsFrom.join(",")}`);
          }
        }
      }
      const first = readMigrationFiles({ migrationsFolder: "drizzle" })[0];
      await client.query("begin");
      try {
        await client.query("create schema if not exists drizzle");
        await client.query("create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)");
        await client.query("insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)", [first.hash, first.folderMillis]);
        await client.query("commit");
      } catch (error) { await client.query("rollback"); throw error; }
    }
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  } finally {
    try { await client.query("select pg_advisory_unlock(87423512)"); }
    finally { client.release(); }
  }
}
