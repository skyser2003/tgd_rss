import util from "util";

import mysql from "mysql";

export class DB {
    private pool: mysql.Pool;

    constructor(config: mysql.PoolConfig) {
        this.pool = mysql.createPool(config);
    }

    async query(query: string, ...args: any[]) {
        const getConnection = util.promisify(this.pool.getConnection);
        const conn = await getConnection();
        conn.query(query, ...args).values;
    }
}