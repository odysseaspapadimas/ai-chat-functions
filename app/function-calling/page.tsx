"use client";

import { Message } from "ai/react";
import { useChat } from "ai/react";
import { ChatRequest, FunctionCallHandler, nanoid } from "ai";

export default function Chat() {
  const functionCallHandler: FunctionCallHandler = async (
    chatMessages,
    functionCall
  ) => {
    if (functionCall.name === "get_current_time") {
      const time = new Date().toLocaleTimeString();

      const functionResponse: ChatRequest = {
        messages: [
          ...chatMessages,
          {
            id: nanoid(),
            name: "get_current_time",
            role: "function" as const,
            content: JSON.stringify({ time }),
          },
        ],
      };

      return functionResponse;
    } else if (functionCall.name === "call_number") {
      if (functionCall.arguments) {
        const args: { number: string } = JSON.parse(functionCall.arguments);
        const functionResponse: ChatRequest = {
          messages: [
            ...chatMessages,
            {
              id: nanoid(),
              name: "call_number",
              role: "function" as const,
              content: "",
            },
          ],
        };

        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance("Redirecting to phone");
        synth.speak(utterance);

        //open phone app
        setTimeout(() => {
          open(`tel:${args.number}`);
        }, 3000);

        return functionResponse;
      }
    }
  };

  const { messages, input, handleInputChange, handleSubmit, data } = useChat({
    api: "/api/chat-with-functions",
    experimental_onFunctionCall: functionCallHandler,
  });

  // Generate a map of message role to text color
  const roleToColorMap: Record<Message["role"], string> = {
    system: "red",
    user: "black",
    function: "blue",
    assistant: "green",
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.length > 0
        ? messages.map((m: Message) => (
            <div
              key={m.id}
              className="whitespace-pre-wrap"
              style={{ color: roleToColorMap[m.role] }}
            >
              <strong>{`${m.role}: `}</strong>
              {m.content || JSON.stringify(m.function_call)}
              <br />
              <br />
            </div>
          ))
        : null}
      <div id="chart-goes-here"></div>
      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
