import { invoke } from "@tauri-apps/api/core";

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
