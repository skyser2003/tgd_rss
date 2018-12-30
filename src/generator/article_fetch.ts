import request from "request";
import { JSDOM } from "jsdom";

class ArticleInfo {
    constructor(public order: number,
        public title: string,
        public articleId: string,
        public time: Date | undefined) {

    }
}

export class ArticleFetcher {
    constructor(public readonly streamerNickname: string) {

    }

    async requestGet(uri: string) {
        return new Promise<[request.Response, string]>((resolve, reject) => {
            request.get(uri, (err, res, body) => {
                if (err) {
                    reject(err);
                }

                resolve([res, body]);
            });
        });
    }

    getArticleInfo(articleUrl: string) {
        return this.requestGet(articleUrl)
            .then(([res, body]) => {
                const dom = new JSDOM(body);
                const doc = dom.window.document;

                const timeElem = doc.getElementById("article-time");
                if (timeElem === null) {
                    // Maybe secret article, maybe not
                    return undefined;
                }

                const dateStr = timeElem!.getElementsByTagName("span")[0].textContent as string;
                const date = new Date(dateStr);

                return date;
            });
    }

    async getRecentArticles() {
        const rootUrl = new URL(`https://tgd.kr/${this.streamerNickname}/page/1/`);

        const [res, body] = await this.requestGet(rootUrl.href);

        const dom = new JSDOM(body);

        const doc = dom.window.document;
        const elements = doc.querySelectorAll(".list-title");

        const articles = [] as HTMLAnchorElement[];

        let isRecentArticles = false;

        elements.forEach(element => {
            if (isRecentArticles === false) {
                const isAnnouncement = element.getElementsByClassName("fa-info-circle").length !== 0;
                if (isAnnouncement === false) {
                    isRecentArticles = true;
                }
            }

            if (isRecentArticles === false) {
                return;
            }

            const article = element.getElementsByTagName("a")[0];
            articles.push(article);
        });

        const firstArticle = articles[0];
        if (firstArticle.parentElement!.getElementsByClassName("fa-star") !== null) {
            articles.shift();
        }

        const recentArticles = [] as ArticleInfo[];

        const promises = articles.map((article, index) => {
            const title = article.attributes.getNamedItem("title")!.value;
            let articleId = article.attributes.getNamedItem("href")!.value;
            if (articleId[0] === "/") {
                articleId = articleId.slice(1);
            }

            const articleUrl = new URL(articleId, rootUrl);
            return this.getArticleInfo(articleUrl.href)
                .then(date => {
                    recentArticles.push(new ArticleInfo(index, title, articleId, date));
                });
        })

        await Promise.all(promises);

        recentArticles.sort((art1, art2) => art1.order - art2.order);
        return recentArticles;
    }
}