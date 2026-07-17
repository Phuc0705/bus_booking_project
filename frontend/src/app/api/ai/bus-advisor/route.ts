import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  stepCountIs,
  type UIMessage,
} from "ai";
import { busAdvisorChatModel } from "@/lib/ai/bus-advisor/github-models";
import { BUS_ADVISOR_SYSTEM_PROMPT } from "@/lib/ai/bus-advisor/prompts";
import { createBusAdvisorTools } from "@/lib/ai/bus-advisor/tools";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const currentDate = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  const result = streamText({
    model: busAdvisorChatModel,
    system: `${BUS_ADVISOR_SYSTEM_PROMPT}\n\n[THÔNG TIN THỜI GIAN THỰC]\n- Bây giờ là: ${currentDate}. Hãy dùng mốc thời gian này để hiểu "hôm nay", "ngày mai" hoặc khi người dùng hỏi giờ.`,
    messages: await convertToModelMessages(messages),
    tools: createBusAdvisorTools(),
    stopWhen: stepCountIs(5),
  });

  const stream = toUIMessageStream({
    stream: result.stream,
    onError(error) {
      console.error("[bus-advisor]", error);
      return "Đã có lỗi khi xử lý yêu cầu AI Bus Advisor.";
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
}
