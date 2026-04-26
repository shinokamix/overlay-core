import { invoke } from "@tauri-apps/api/core";

export type ChatMessageResponse = {
  text: string;
};

export async function sendChatMessage(text: string): Promise<ChatMessageResponse> {
  return invoke<ChatMessageResponse>("send_chat_message", { input: { text } });
}
