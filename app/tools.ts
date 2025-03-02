const searchOnArxiv = (query) =>{
    const baseUrl = "https://arxivxplorer.com/?query=";
    return baseUrl + encodeURIComponent(query);
}

const getArxivDocuments = async (query) => {
    let options = new chrome.Options();
    options.addArguments('--headless', '--no-sandbox', '--ignore-certificate-errors');
    options.addArguments("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    let documents = [];

    try {
        let url = searchOnArxiv(query);
        console.log("Searching for ...", url);
        await driver.get(url);

        await driver.wait(until.elementsLocated(By.xpath("//div[contains(@class, 'css-1086mds')]/div/div/div/p")), 10000);

        let resultDivs = await driver.findElements(By.xpath("//div[contains(@class, 'css-1086mds')]/div[2]/div/div/p"));

        for (let div of resultDivs.slice(0, 10)) {
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

const isPubMedArticle = (link) =>{
    pattern = /^https:\/\/pubmed.+\/[0-9]{8}\/$/;
    return pattern.test(link);
}

const searchOnPubMed = (query) => {
    const baseUrl = "https://pubmedisearch.com/share/";
    return baseUrl + encodeURIComponent(query);
}

const getPubMedDocuments = async (query) => {
    let options = new chrome.Options();
    options.addArguments('--headless', '--no-sandbox', '--ignore-certificate-errors');
    options.addArguments("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    let documents = [];

    try {
        let url = searchOnPubMed(query);
        console.log("Searching for ...", url);
        await driver.get(url);

        await driver.wait(until.elementLocated(By.xpath("/html/body/div/div/div/button")), 10000);

        let allLinks = await driver.findElements(By.tagName("a"));
        let gatheredResults = new Set();

        for (let link of allLinks) {
            let href = await link.getAttribute("href");
            if (isPubMedArticle(href)) {
                gatheredResults.add(href);
                if (gatheredResults.size === 10) break;
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

async function pubMedSearch(query) {
    // Retrieve articles from PubMed based on the query
    const articles = (await getPubMedDocuments(query))
      .map(p => p[0]) // Get titles of the articles
      .join("\n\n");
  
    const llm = new OpenAI({
        model: "gpt-3.5-turbo-instruct",
        temperature: 0,
      });
  
    // Define the prompt template
    const promptTemplate = new PromptTemplate( `
        You are an assistant that answers questions and settles arguments with facts that you infer from the context provided below.
        When the questions are inherently trying to prove a stance, ensure that you find evidence for both 'for' and 'against' stances, to ensure that you are not biased towards one stance.
        Your job is to explain why and also provide support for why one of the two stances is closer to the truth or is actually true.
        For each paper you read, make sure you cite the authors and provide links to it, and what parts of your answer are from it.
  
        You have to make sure that you do not hallucinate responses, say it when you can't find enough evidence.
        You need to include background information for some medical jargon, answer for a college freshman.
        You can use other information from the web or outside the context, to explain some topics in the answer you will find from the context.
        DO NOT make up facts. DO NOT answer from outside the context, only go out of the context to explain jargon used in it.
  
        Question: {question}
        Context: {context}
      `
    );
  
    // Format the prompt with the question and articles as context
    const prompt = promptTemplate.format({
      question: query,
      context: articles
    });
  
    // Invoke OpenAI with the formatted prompt
    try {
      const response = llm.invoke(prompt);  
      return response;

    } catch (error) {
      console.error('Error during OpenAI API call:', error);
      return 'An error occurred during processing.';
    }
}

async function arxivSearch(query) {
    // Retrieve articles from PubMed based on the query
    const articles = (await getArxivDocuments(query))
      .join("\n\n");
  
    const llm = new OpenAI({
        model: "gpt-3.5-turbo-instruct",
        temperature: 0,
      });
  
    // Define the prompt template
    const promptTemplate = new PromptTemplate( `
        You are an assistant that answers questions and settles arguments with facts that you infer from the context provided below.
        When the questions are inherently trying to prove a stance, ensure that you find evidence for both 'for' and 'against' stances, to ensure that you are not biased towards one stance.
        Your job is to explain why and also provide support for why one of the two stances is closer to the truth or is actually true.
        For each paper you read, make sure you cite the authors and provide links to it, and what parts of your answer are from it.
  
        You have to make sure that you do not hallucinate responses, say it when you can't find enough evidence.
        You need to include background information for some medical jargon, answer for a college freshman.
        You can use other information from the web or outside the context, to explain some topics in the answer you will find from the context.
        DO NOT make up facts. DO NOT answer from outside the context, only go out of the context to explain jargon used in it.
  
        Question: {question}
        Context: {context}
      `
    );
  
    // Format the prompt with the question and articles as context
    const prompt = promptTemplate.format({
      question: query,
      context: articles
    });
  
    // Invoke OpenAI with the formatted prompt
    try {
      const response = llm.invoke(prompt);  
      return response;

    } catch (error) {
      console.error('Error during OpenAI API call:', error);
      return 'An error occurred during processing.';
    }
}
export {
    pubMedSearch,
    arxivSearch
}