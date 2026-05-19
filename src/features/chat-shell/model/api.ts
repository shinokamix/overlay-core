import { Channel, invoke } from "@tauri-apps/api/core";

export type ChatRole = "system" | "user" | "assistant";

export type WireChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatMessageResponse = {
  text: string;
};

export async function sendChatMessage(messages: WireChatMessage[]): Promise<ChatMessageResponse> {
  return invoke<ChatMessageResponse>("send_chat_message", {
    input: { messages },
  });
}

export type ChatChunk = { text: string };

export function streamChatMessage(
  messages: WireChatMessage[],
  onChunk: (chunk: ChatChunk) => void,
): Promise<void> {
  const channel = new Channel<ChatChunk>();
  channel.onmessage = onChunk;
  return invoke<void>("stream_chat_message", { input: { messages }, onEvent: channel });
}
