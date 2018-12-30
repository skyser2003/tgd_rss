import { ArticleFetcher } from "./article_fetch";

class Main {
    constructor() {
    }

    async run() {
        const articleFetcher = new ArticleFetcher("test1");
        const articles = await articleFetcher.getRecentArticles();
        console.log(articles);
    }
}

const main = new Main();
main.run();