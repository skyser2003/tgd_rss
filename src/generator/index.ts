import { ArticleFetcher } from "./article_fetch";
import { DB } from "./db";

class Main {
    constructor() {
    }

    async run() {
        const dbUrl = process.env.DB_URL || "localhost";
        const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;

        const db = new DB({
            host: dbUrl,
            port: dbPort
        });

        db.query("SELECT * FROM `articles` JOIN `streamer` ON `streamer`.`uid` = `articles`.`streamer_uid`");

        const articleFetcher = new ArticleFetcher("test1");
        const articles = await articleFetcher.getRecentArticles();
        console.log(articles);
    }
}

const main = new Main();
main.run();