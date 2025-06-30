import { HeroUIProvider } from "@heroui/react";
import { VoiceCall, LiveTranscription } from "./components";
import { useState } from "react";

function App() {
  const [activeTab, setActiveTab] = useState<"voice" | "transcription">(
    "transcription"
  );

  const handleCallStart = () => {
    console.log("通话开始");
  };

  const handleCallEnd = () => {
    console.log("通话结束");
  };

  const handleAudioData = (audioBlob: Blob) => {
    console.log("接收到音频数据:", audioBlob);
    // 这里可以处理音频数据，比如发送到服务器
  };

  const handleTranscriptionUpdate = (data: any) => {
    console.log("转录更新:", data);
  };

  const handleConnectionChange = (connected: boolean) => {
    console.log("连接状态变化:", connected);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 标签切换 */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            <button
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === "voice"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab("voice")}
            >
              语音通话
            </button>
            <button
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === "transcription"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab("transcription")}
            >
              实时转录
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        {activeTab === "voice" ? (
          <div className="flex justify-center">
            <VoiceCall
              onCallStart={handleCallStart}
              onCallEnd={handleCallEnd}
              onAudioData={handleAudioData}
            />
          </div>
        ) : (
          <LiveTranscription
            defaultWebSocketUrl="ws://localhost:8000/asr"
            onTranscriptionUpdate={handleTranscriptionUpdate}
            onConnectionChange={handleConnectionChange}
          />
        )}
      </div>
    </div>
  );
}

export default function Container() {
  return (
    <HeroUIProvider>
      <App />
    </HeroUIProvider>
  );
}
