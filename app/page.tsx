"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Loader2, Plus, Square } from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { ChatHeader } from "@/app/parts/chat-header";
import { ChatHeaderBlock } from "@/app/parts/chat-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import {
  AI_NAME,
  CLEAR_CHAT_TEXT,
  OWNER_NAME,
  WELCOME_MESSAGE,
} from "@/config";
import Image from "next/image";
import Link from "next/link";

const formSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message must be at most 2000 characters."),
});

const STORAGE_KEY = "chat-messages";

type StorageData = {
  messages: UIMessage[];
  durations: Record<string, number>;
};

const loadMessagesFromStorage = (): {
  messages: UIMessage[];
  durations: Record<string, number>;
} => {
  if (typeof window === "undefined") return { messages: [], durations: {} };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { messages: [], durations: {} };

    const parsed = JSON.parse(stored);
    return {
      messages: parsed.messages || [],
      durations: parsed.durations || {},
    };
  } catch (error) {
    console.error("Failed to load messages from localStorage:", error);
    return { messages: [], durations: {} };
  }
};

const saveMessagesToStorage = (
  messages: UIMessage[],
  durations: Record<string, number>
) => {
  if (typeof window === "undefined") return;
  try {
    const data: StorageData = { messages, durations };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save messages to localStorage:", error);
  }
};

export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeMessageShownRef = useRef<boolean>(false);

  const stored =
    typeof window !== "undefined"
      ? loadMessagesFromStorage()
      : { messages: [], durations: {} };
  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initialMessages,
  });

  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);
    setMessages(stored.messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isClient) {
      saveMessagesToStorage(messages, durations);
    }
  }, [durations, messages, isClient]);

  const handleDurationChange = (key: string, duration: number) => {
    setDurations((prevDurations) => {
      const newDurations = { ...prevDurations };
      newDurations[key] = duration;
      return newDurations;
    });
  };

  useEffect(() => {
    if (
      isClient &&
      initialMessages.length === 0 &&
      !welcomeMessageShownRef.current
    ) {
      const welcomeMessage: UIMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        parts: [
          {
            type: "text",
            text: WELCOME_MESSAGE,
          },
        ],
      };
      setMessages([welcomeMessage]);
      saveMessagesToStorage([welcomeMessage], {});
      welcomeMessageShownRef.current = true;
    }
  }, [isClient, initialMessages.length, setMessages]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    sendMessage({ text: data.message });
    form.reset();
  }

  function clearChat() {
    const newMessages: UIMessage[] = [];
    const newDurations = {};
    setMessages(newMessages);
    setDurations(newDurations);
    saveMessagesToStorage(newMessages, newDurations);
    toast.success("Chat cleared");
  }

  const quickPrompts = [
    "I’m feeling anxious about exams",
    "I’m overwhelmed with work",
    "I feel low and unmotivated",
    "I just want a 1-minute reset",
  ];

  return (
    <div className="flex h-screen items-center justify-center font-sans bg-emerald-50/40 dark:bg-black">
      <main className="relative h-screen w-full bg-transparent">
        {/* Top gradient header */}
        <div className="fixed left-0 right-0 top-0 z-50 overflow-visible bg-linear-to-b from-background via-background/60 to-transparent dark:bg-black pb-16">
          <div className="relative overflow-visible">
            <ChatHeader>
              {/* Left side spacer / optional content */}
              <ChatHeaderBlock />

              {/* Center: Koa identity */}
              <ChatHeaderBlock className="items-center justify-center gap-3">
                <Avatar className="size-9 ring-1 ring-emerald-300 bg-white shadow-sm">
                  {/* Use your Koa icon here */}
                  <AvatarImage src="/koa-icon.png" />
                  <AvatarFallback>
                    <Image
                      src="/koa-icon.png"
                      alt="Koa icon"
                      width={36}
                      height={36}
                    />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold tracking-tight text-slate-900">
                    {AI_NAME} · Well-Being Companion
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Share how you&apos;re feeling; I&apos;ll suggest a 1–2 minute
                    grounding or micro-mindfulness practice.
                  </p>
                </div>
              </ChatHeaderBlock>

              {/* Right side: clear chat button */}
              <ChatHeaderBlock className="justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer rounded-full border-emerald-200 bg-white/70 text-xs hover:bg-emerald-50"
                  onClick={clearChat}
                >
                  <Plus className="mr-1 size-4" />
                  {CLEAR_CHAT_TEXT}
                </Button>
              </ChatHeaderBlock>
            </ChatHeader>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="h-screen w-full overflow-y-auto px-5 py-4 pt-[96px] pb-[150px]">
          <div className="flex min-h-full flex-col items-center justify-start">
            <div className="mb-3 flex w-full max-w-3xl flex-col gap-2">
              <p className="text-xs text-slate-500">
                Not sure how to begin? You can start with one of these:
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="rounded-full border border-emerald-100 bg-emerald-50/70 px-3 py-1 text-emerald-900 transition hover:bg-emerald-100"
                    onClick={() => {
                      form.setValue("message", prompt);
                      sendMessage({ text: prompt });
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {isClient ? (
              <>
                <MessageWall
                  messages={messages}
                  status={status}
                  durations={durations}
                  onDurationChange={handleDurationChange}
                />
                {status === "submitted" && (
                  <div className="flex w-full max-w-3xl justify-start">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] text-emerald-900">
                      <Loader2 className="size-3 animate-spin" />
                      Koa is thinking of a gentle next step…
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex w-full max-w-2xl justify-center">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Input & footer */}
        <div className="fixed bottom-0 left-0 right-0 z-50 overflow-visible bg-linear-to-t from-background via-background/60 to-transparent dark:bg-black pt-13">
          <div className="flex w-full items-center justify-center px-5 pt-5 pb-1 relative overflow-visible">
            <div className="message-fade-overlay" />
            <div className="w-full max-w-3xl">
              <form id="chat-form" onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Controller
                    name="message"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          htmlFor="chat-form-message"
                          className="sr-only"
                        >
                          Message
                        </FieldLabel>
                        <div className="relative h-13">
                          <Input
                            {...field}
                            id="chat-form-message"
                            className="h-15 rounded-[20px] bg-card pl-5 pr-15"
                            placeholder="Tell Koa how you’re feeling or what’s stressing you out…"
                            disabled={status === "streaming"}
                            aria-invalid={fieldState.invalid}
                            autoComplete="off"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                form.handleSubmit(onSubmit)();
                              }
                            }}
                          />
                          {(status === "ready" || status === "error") && (
                            <Button
                              className="absolute right-3 top-3 rounded-full"
                              type="submit"
                              disabled={!field.value.trim()}
                              size="icon"
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                          )}
                          {(status === "streaming" || status === "submitted") && (
                            <Button
                              className="absolute right-2 top-2 rounded-full"
                              size="icon"
                              onClick={() => {
                                stop();
                              }}
                            >
                              <Square className="size-4" />
                            </Button>
                          )}
                        </div>
                        {/* Safety hint */}
                        <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                          Koa offers simple, non-clinical wellbeing suggestions.
                          It doesn&apos;t replace professional help. If things
                          feel very heavy or unsafe, please reach out to someone
                          you trust or a professional.
                        </p>
                      </Field>
                    )}
                  />
                </FieldGroup>
              </form>
            </div>
          </div>
          <div className="flex w-full items-center justify-center px-5 py-3 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {OWNER_NAME}&nbsp;
            <Link href="/terms" className="underline">
              Terms of Use
            </Link>
            &nbsp;Powered by&nbsp;
            <Link href="https://ringel.ai/" className="underline">
              Ringel.AI
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
