import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { BaseRetriever } from "@langchain/core/retrievers";

class CustomPubMedRetriever extends BaseRetriever {
    constructor(topK) {
        super();
        this.topK = topK;
        this.pattern = /^https:\/\/pubmed.+\/[0-9]{8}\/$/;
    }

    isPubMedArticle(link) {
        return this.pattern.test(link);
    }

    searchOnPubMed(query) {
        const baseUrl = "https://pubmedisearch.com/share/";
        return baseUrl + encodeURIComponent(query);
    }

    async getRelevantDocuments(query) {
        let options = new chrome.Options();
        options.addArguments('--headless', '--no-sandbox', '--ignore-certificate-errors');
        options.addArguments("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
        let documents = [];

        try {
            let url = this.searchOnPubMed(query);
            console.log("Searching for ...", url);
            await driver.get(url);

            await driver.wait(until.elementLocated(By.xpath("/html/body/div/div/div/button")), 10000);

            let allLinks = await driver.findElements(By.tagName("a"));
            let gatheredResults = new Set();

            for (let link of allLinks) {
                let href = await link.getAttribute("href");
                if (this.isPubMedArticle(href)) {
                    gatheredResults.add(href);
                    if (gatheredResults.size === this.topK) break;
                }
            }

            for (let link of gatheredResults) {
                await driver.get(link);
                let abstractElement = await driver.findElement(By.xpath("//div[@id='eng-abstract']/p"));
                let pageContent = await abstractElement.getText();
                let title = await driver.getTitle();

                documents.push({ pageContent, metadata: { link, title } });
            }
        } catch (error) {
            console.error(error);
        } finally {
            await driver.quit();
        }
        return documents;
    }
}

class CustomArxivRetriever extends BaseRetriever {
    constructor(topK) {
        super();
        this.topK = topK;
    }

    searchOnArxiv(query) {
        const baseUrl = "https://arxivxplorer.com/?query=";
        return baseUrl + encodeURIComponent(query);
    }

    async getRelevantDocuments(query) {
        let options = new chrome.Options();
        options.addArguments('--headless', '--no-sandbox', '--ignore-certificate-errors');
        options.addArguments("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
        let documents = [];

        try {
            let url = this.searchOnArxiv(query);
            console.log("Searching for ...", url);
            await driver.get(url);

            await driver.wait(until.elementsLocated(By.xpath("//div[contains(@class, 'css-1086mds')]/div/div/div/p")), 10000);

            let resultDivs = await driver.findElements(By.xpath("//div[contains(@class, 'css-1086mds')]/div[2]/div/div/p"));

            for (let div of resultDivs.slice(0, this.topK)) {
                let text = await div.getText();
                documents.push({ pageContent: text, metadata: {} });
            }
        } catch (error) {
            console.error(error);
        } finally {
            await driver.quit();
        }
        return documents;
    }
}

// Usage Example
(async () => {
    let pmRetriever = new CustomPubMedRetriever(10);
    let arxRetriever = new CustomArxivRetriever(10);

    let pubMedResults = await pmRetriever.getRelevantDocuments("AI in Medicine");
    console.log("PubMed Results:", pubMedResults);

    let arxivResults = await arxRetriever.getRelevantDocuments("Deep Learning for Healthcare");
    console.log("ArXiv Results:", arxivResults);
})();
