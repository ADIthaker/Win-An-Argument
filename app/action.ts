"use server"

import { ChatOpenAI } from "@langchain/openai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { AgentExecutor, createReactAgent  } from "langchain/agents";
import { PromptTemplate } from "@langchain/core/prompts";
import { pubMedSearch, arxivSearch } from "@/tools";
import { DynamicTool } from "@langchain/core/tools";
import dotenv from 'dotenv';
dotenv.config()


const tools = [
    new TavilySearchResults({ 
        maxResults: 2,
        description: `A search engine optimized for comprehensive, accurate, and trusted results. Useful for when you need to answer questions about current events. 
        Input should be a search query. Use this when you cant find sufficient information and need more data`
    }), 
    new DynamicTool({
        name: "pubmed-search",
        description:
          "useful for when you need to answer questions about medical scientific facts, claims, or data.",
        func: pubMedSearch,
    }),
    new DynamicTool({
        name: "arxiv-search",
        description:
          "useful for when you need to answer questions about computer related scientific facts, claims, or data",
        func: arxivSearch,
    }),
];

const prompt = PromptTemplate.fromTemplate(
`Answer the following questions as best you can. 
Upon receiving the original input question, break down the question into 2 parts, The 2 possible stances in the argument. Then find evidence to support each stance, it is usually 
expected that you will find concrete evidence for only one of the 2 stances. The final answer should be detailed enough to support one of the 2 stances, it should also include proper citation with links and names of the paper or webpages.
You should give as much detail as possible.
For example, if the question is Does green tea reduce weight?, you should convert it to:
Question: Effects of green tea on weightloss
Stance 1: It causes weightloss
Stance 2: It does not cause weightloss

You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}], and nothing else.
Action Input: the input to the action, a query string in this case or it can be the value passed to the action function as an argument
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question
For example, if you need to search for research papers on compiler optimizations using machine learning, you should output:

Action: arxiv-search
Action Input: "machine learning compiler optimization performance"
Begin!

Question: {input}
Thought:{agent_scratchpad}`
);

const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
  });

const agent = await createReactAgent({
    llm,
    tools,
    prompt,
});

const agentExecutor = new AgentExecutor({
    agent,
    tools,
    returnIntermediateSteps: true,
});


/**
 * Server action to process text on the backend
 * This function runs on the server when called from the client
 */
export async function processTextOnServer(text: string): Promise<string> {
  // This is where you can run any server-side JavaScript processing
  // For example, you could:
  // - Call other APIs
  // - Access databases
  // - Use Node.js libraries that wouldn't work on the client
  // - Perform intensive calculations

  console.log("Processing text on the server:", text)

  // Example processing: Reverse the text and convert to uppercase
  const processed = await agentExecutor.invoke({
    input: text,
  });

  console.log(processed['intermediateSteps'])
  return processed['output'];
}

