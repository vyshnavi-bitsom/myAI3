
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { MODEL } from '@/config';

export const maxDuration = 30;
export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
        model: MODEL,
        messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
        sendReasoning: true,
    });
}