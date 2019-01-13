import { ArticleFetcher } from "./article_fetch";
import { DB } from "./db";

class Main {
    constructor() {
    }

    async run() {
        const dbUrl = process.env.DB_URL || "localhost";
        const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;
        const dbUser = process.env.DB_USER || "root";
        const dbPassword = process.env.DB_PASSWORD || "root";
        const dbDatabse = "tgd";

        const db = new DB({
            host: dbUrl,
            port: dbPort,
            database: dbDatabse,
            user: dbUser,
            password: dbPassword
        });

        const streamerName = "test1";

        const articleFetcher = new ArticleFetcher(streamerName);
        const articles = await articleFetcher.getRecentArticles();

        const insertData = articles.articles.map(article => {
            return [article.articleId, articles.streamerId, article.title, ""];
        });

        db.query("INSERT IGNORE INTO `streamer` (`tgd_id`, `name`) VALUES (?, ?)", articles.streamerId, streamerName);

        db.query("INSERT IGNORE INTO `articles` (`article_id`, `streamer_uid`, `title`, `content`) VALUES ?", insertData);
        db.query("SELECT * FROM `articles` JOIN `streamer` ON `streamer`.`tgd_id` = `articles`.`streamer_uid`");
    }
}

const main = new Main();
main.run();