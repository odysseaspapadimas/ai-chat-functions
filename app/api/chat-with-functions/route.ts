import {
  OpenAIStream,
  StreamingTextResponse,
  experimental_StreamData,
} from "ai";
import OpenAI from "openai";
import { CompletionCreateParams } from "openai/resources/chat";
// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

const functions: CompletionCreateParams.Function[] = [
  {
    name: "get_current_weather",
    description: "Get the current weather.",
    parameters: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description: "The temperature unit to use.",
        },
      },
      required: ["format"],
    },
  },
  {
    name: "get_current_time",
    description: "Get the current time",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "call_number",
    description: "Call a number",
    parameters: {
      type: "object",
      properties: {
        number: {
          type: "string",
          description: "The number to call",
        },
      },
      required: ["number"],
    },
  },
];

export async function POST(req: Request) {
  const { messages } = await req.json();

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-0613",
    stream: true,
    messages,
    functions,
  });

  const data = new experimental_StreamData();
  const stream = OpenAIStream(response, {
    experimental_onFunctionCall: async (
      { name, arguments: args },
      createFunctionCallMessages
    ) => {
      if (name === "get_current_weather") {
        // Call a weather API here
        const weatherData = {
          temperature: 20,
          unit: args.format === "celsius" ? "C" : "F",
        };

        data.append({
          text: "Some custom data",
        });

        const newMessages = createFunctionCallMessages(weatherData);
        return openai.chat.completions.create({
          messages: [...messages, ...newMessages],
          stream: true,
          model: "gpt-3.5-turbo-0613",
        });
      }
    },
    onCompletion(completion) {
      console.log("completion", completion);
    },
    onFinal(completion) {
      data.close();
    },
    experimental_streamData: true,
  });

  data.append({
    text: "Hello, how are you?",
  });

  return new StreamingTextResponse(stream, {}, data);
}
