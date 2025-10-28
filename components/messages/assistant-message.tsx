import { UIMessage } from "ai";
import { Response } from "@/components/ai-elements/response";
import { ReasoningPart } from "./reasoning-part";

export function AssistantMessage({ message, status, isLastMessage }: { message: UIMessage; status?: string; isLastMessage?: boolean }) {
    return (
        <div className="mb-4 w-full">
            <div className="text-sm">
                {message.parts.map((part, i) => {
                    const isStreaming = status === "streaming" && isLastMessage && i === message.parts.length - 1;
                    switch (part.type) {
                        case "text":
                            return <Response key={`${message.id}-${i}`}>{part.text}</Response>;
                        case "reasoning":
                            return <ReasoningPart key={`${message.id}-${i}`} part={part} isStreaming={isStreaming} />;
                    }
                })}
            </div>
        </div>
    )
}