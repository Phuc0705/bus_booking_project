"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";

function renderMessagePart(part: any, index: number) {
  if (part.type === "text") {
    return (
      <span key={index} className="whitespace-pre-wrap">
        {part.text}
      </span>
    );
  }
  if (part.type.startsWith("tool-")) {
    const state = part.state;
    return (
      <div
        key={index}
        className="my-2 flex items-center rounded-md bg-gray-100 p-2 text-xs text-gray-500 italic"
      >
        {state !== "output-available" && state !== "output-error" && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
        {state === "input-streaming" && "Đang chuẩn bị tra cứu dữ liệu..."}
        {state === "input-available" && "Đang gọi công cụ tra cứu dữ liệu..."}
        {state === "output-available" && "Đã tra cứu dữ liệu xong."}
        {state === "output-error" && "Công cụ đọc dữ liệu bị lỗi."}
      </div>
    );
  }
  return null;
}

export function BusAdvisorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/bus-advisor" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    sendMessage({ text: value });
    setInput("");
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 transition-all z-50 flex items-center justify-center group"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap group-hover:ml-2">
            Hỏi AI Advisor
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-bold">AI Bus Advisor</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-500">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
                <p>Xin chào! Mình là trợ lý AI.<br/>Mình có thể giúp bạn tìm chuyến xe, kiểm tra vé hoặc tư vấn thủ tục.</p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
                  }`}>
                    {(m.parts as any[])?.map((part, index) => renderMessagePart(part, index))}
                  </div>
                </div>
              ))
            )}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 shadow-sm border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100">
            <div className="relative flex items-center">
              <input
                value={input || ""}
                onChange={handleInputChange}
                placeholder="Nhập câu hỏi của bạn..."
                className="w-full pl-4 pr-12 py-3 bg-gray-100 text-gray-900 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button 
                type="submit" 
                disabled={isLoading || !(input || "").trim()}
                className="absolute right-2 p-2 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
