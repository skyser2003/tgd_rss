import request from "request";
import { JSDOM } from "jsdom";

class ArticleInfo {
    constructor(public order: number,
        public title: string,
        public author: string,
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

        const articles = [] as Element[];

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

            articles.push(element);
        });

        const firstArticle = articles[0];
        if (firstArticle.getElementsByClassName("fa-star") !== null) {
            articles.shift();
        }

        const recentArticles = [] as ArticleInfo[];

        const promises = articles.map((article, index) => {
            const titleElem = article.getElementsByTagName("a")[0];
            const authorElem = article.getElementsByClassName("list-writer")[0].getElementsByTagName("span")[0];

            const title = titleElem.attributes.getNamedItem("title")!.value;
            const author = (authorElem!.textContent as string).trim();

            let articleId = titleElem.attributes.getNamedItem("href")!.value;
            if (articleId[0] === "/") {
                articleId = articleId.slice(1);
            }

            const articleUrl = new URL(articleId, rootUrl);
            return this.getArticleInfo(articleUrl.href)
                .then(date => {
                    recentArticles.push(new ArticleInfo(index, title, author, articleId, date));
                });
        })

        await Promise.all(promises);

        recentArticles.sort((art1, art2) => art1.order - art2.order);
        return recentArticles;
    }
}