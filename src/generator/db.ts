import util from "util";

import mysql from "mysql";

export class DB {
    private pool: mysql.Pool;

    constructor(config: mysql.PoolConfig) {
        this.pool = mysql.createPool(config);
    }

    async query(query: string, ...args: any[]) {
        return new Promise<any>((resolve, reject) => {
            this.pool.getConnection((err, conn) => {
                if (err) {
                    reject(err);
                    return;
                }

                const result = conn.query(query, ...args).values;
                resolve(result);
            });
        });
    }
}