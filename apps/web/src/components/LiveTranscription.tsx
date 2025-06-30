import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import {
  MicIcon,
  SettingsIcon,
  WifiIcon,
  WifiOffIcon,
  LoaderIcon,
} from "lucide-react";

interface TranscriptionLine {
  speaker: number;
  text: string;
  beg?: number;
  end?: number;
}

interface TranscriptionData {
  lines: TranscriptionLine[];
  buffer_transcription: string;
  buffer_diarization: string;
  remaining_time_transcription: number;
  remaining_time_diarization: number;
  status: string;
  type?: string;
}

interface LiveTranscriptionProps {
  defaultWebSocketUrl?: string;
  onTranscriptionUpdate?: (data: TranscriptionData) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const LiveTranscription: React.FC<LiveTranscriptionProps> = ({
  defaultWebSocketUrl,
  onTranscriptionUpdate,
  onConnectionChange,
}) => {
  // 状态管理
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState("点击开始实时转录");
  const [chunkDuration, setChunkDuration] = useState(1000);
  const [websocketUrl, setWebsocketUrl] = useState(
    defaultWebSocketUrl || "ws://localhost:8000/asr"
  );
  const [transcriptionLines, setTranscriptionLines] = useState<
    TranscriptionLine[]
  >([]);
  const [bufferText, setBufferText] = useState("");
  const [recordingTime, setRecordingTime] = useState("00:00");
  const [waitingForStop, setWaitingForStop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const websocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined
  );
  const startTimeRef = useRef<number | undefined>(undefined);
  const lastReceivedDataRef = useRef<TranscriptionData | null>(null);
  const userClosingRef = useRef(false);

  // 更新计时器
  const updateTimer = useCallback(() => {
    if (!startTimeRef.current) return;

    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const minutes = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");
    setRecordingTime(`${minutes}:${seconds}`);
  }, []);

  // 绘制音频波形
  const drawWaveform = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#10b981";
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  // 建立 WebSocket 连接
  const setupWebSocket = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        websocketRef.current = new WebSocket(websocketUrl);
      } catch (error) {
        setStatus("无效的 WebSocket URL，请检查后重试");
        reject(error);
        return;
      }

      websocketRef.current.onopen = () => {
        setStatus("已连接到服务器");
        setIsConnected(true);
        onConnectionChange?.(true);
        resolve();
      };

      websocketRef.current.onclose = () => {
        setIsConnected(false);
        onConnectionChange?.(false);

        if (userClosingRef.current) {
          if (waitingForStop && lastReceivedDataRef.current) {
            renderTranscription(lastReceivedDataRef.current, true);
          }
          setStatus("转录完成，准备开始新的录音");
        } else {
          setStatus("与服务器断开连接（检查服务器是否正在运行）");
          if (isRecording) {
            stopRecording();
          }
        }

        setWaitingForStop(false);
        userClosingRef.current = false;
        lastReceivedDataRef.current = null;
        websocketRef.current = null;
      };

      websocketRef.current.onerror = () => {
        setStatus("WebSocket 连接错误");
        reject(new Error("WebSocket 连接错误"));
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const data: TranscriptionData = JSON.parse(event.data);

          if (data.type === "ready_to_stop") {
            setWaitingForStop(false);
            if (lastReceivedDataRef.current) {
              renderTranscription(lastReceivedDataRef.current, true);
            }
            setStatus("音频处理完成！准备开始新的录音");
            if (websocketRef.current) {
              websocketRef.current.close();
            }
            return;
          }

          lastReceivedDataRef.current = data;
          renderTranscription(data, false);
          onTranscriptionUpdate?.(data);
        } catch (error) {
          console.error("解析 WebSocket 消息失败:", error);
        }
      };
    });
  }, [
    websocketUrl,
    isRecording,
    waitingForStop,
    onConnectionChange,
    onTranscriptionUpdate,
  ]);

  // 渲染转录结果
  const renderTranscription = useCallback(
    (data: TranscriptionData, isFinalizing: boolean = false) => {
      if (data.status === "no_audio_detected") {
        setTranscriptionLines([]);
        setBufferText("未检测到音频...");
        return;
      }

      const lines = data.lines || [];
      const processedLines = lines.map((line, index) => {
        let processedLine = { ...line };

        // 如果是最后一行且不是最终化状态，添加缓冲区内容
        if (index === lines.length - 1 && !isFinalizing) {
          let bufferContent = "";

          if (data.buffer_diarization) {
            bufferContent += data.buffer_diarization;
          }
          if (data.buffer_transcription) {
            bufferContent +=
              (bufferContent ? " " : "") + data.buffer_transcription;
          }

          if (bufferContent) {
            processedLine.text = (line.text || "") + " " + bufferContent;
          }
        } else if (index === lines.length - 1 && isFinalizing) {
          // 最终化时，直接合并所有内容
          let finalText = line.text || "";
          if (data.buffer_diarization) {
            finalText += (finalText ? " " : "") + data.buffer_diarization;
          }
          if (data.buffer_transcription) {
            finalText += (finalText ? " " : "") + data.buffer_transcription;
          }
          processedLine.text = finalText;
        }

        return processedLine;
      });

      setTranscriptionLines(processedLines);

      // 设置状态信息
      if (
        !isFinalizing &&
        (data.remaining_time_transcription > 0 ||
          data.remaining_time_diarization > 0)
      ) {
        let statusInfo = "";
        if (data.remaining_time_transcription > 0) {
          statusInfo += `转录延迟: ${data.remaining_time_transcription}s `;
        }
        if (data.remaining_time_diarization > 0) {
          statusInfo += `说话人识别延迟: ${data.remaining_time_diarization}s`;
        }
        setBufferText(statusInfo);
      } else {
        setBufferText("");
      }
    },
    []
  );

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // 设置音频上下文
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      microphoneRef.current =
        audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);

      // 设置媒体录制器
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (
          websocketRef.current &&
          websocketRef.current.readyState === WebSocket.OPEN
        ) {
          websocketRef.current.send(event.data);
        }
      };

      mediaRecorderRef.current.start(chunkDuration);

      // 开始计时
      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(updateTimer, 1000);

      // 开始波形绘制
      drawWaveform();

      setIsRecording(true);
      setStatus("录音中...");
    } catch (error) {
      setStatus("无法访问麦克风，请允许麦克风权限");
      console.error(error);
    }
  }, [chunkDuration, updateTimer, drawWaveform]);

  // 停止录音
  const stopRecording = useCallback(async () => {
    userClosingRef.current = true;
    setWaitingForStop(true);

    if (
      websocketRef.current &&
      websocketRef.current.readyState === WebSocket.OPEN
    ) {
      // 发送空音频缓冲区作为停止信号
      const emptyBlob = new Blob([], { type: "audio/webm" });
      websocketRef.current.send(emptyBlob);
      setStatus("录音已停止，正在处理最终音频...");
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        await audioContextRef.current.close();
      } catch (e) {
        console.warn("无法关闭音频上下文:", e);
      }
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = undefined;
    }

    setRecordingTime("00:00");
    startTimeRef.current = undefined;
    setIsRecording(false);
  }, []);

  // 切换录音状态
  const toggleRecording = useCallback(async () => {
    if (!isRecording) {
      if (waitingForStop) {
        return;
      }

      try {
        if (
          websocketRef.current &&
          websocketRef.current.readyState === WebSocket.OPEN
        ) {
          await startRecording();
        } else {
          await setupWebSocket();
          await startRecording();
        }
      } catch (error) {
        setStatus("无法连接到 WebSocket 或访问麦克风");
        console.error(error);
      }
    } else {
      stopRecording();
    }
  }, [
    isRecording,
    waitingForStop,
    startRecording,
    stopRecording,
    setupWebSocket,
  ]);

  // 渲染说话人标签
  const renderSpeakerLabel = (
    speaker: number,
    timeInfo: string,
    isLoading: boolean = false
  ) => {
    if (speaker === -2) {
      return (
        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
          静音 {timeInfo}
        </span>
      );
    } else if (speaker === 0 && isLoading) {
      return (
        <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-sm">
          <LoaderIcon className="inline w-3 h-3 mr-1 animate-spin" />
          说话人识别中...
        </span>
      );
    } else if (speaker === -1) {
      return (
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
          说话人 1 {timeInfo}
        </span>
      );
    } else if (speaker > 0) {
      return (
        <span className="inline-block px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
          说话人 {speaker} {timeInfo}
        </span>
      );
    }
    return null;
  };

  // 清理资源
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      stopRecording();
    };
  }, [stopRecording]);

  const chunkOptions = [
    { value: "500", label: "500 ms" },
    { value: "1000", label: "1000 ms" },
    { value: "2000", label: "2000 ms" },
    { value: "3000", label: "3000 ms" },
    { value: "4000", label: "4000 ms" },
    { value: "5000", label: "5000 ms" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      {/* 标题和状态 */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">实时语音转录</h1>
        <p className="text-gray-600 mb-4">{status}</p>

        {/* 连接状态指示器 */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          {isConnected ? (
            <>
              <WifiIcon className="w-5 h-5 text-green-500" />
              <span className="text-green-600">已连接</span>
            </>
          ) : (
            <>
              <WifiOffIcon className="w-5 h-5 text-red-500" />
              <span className="text-red-600">未连接</span>
            </>
          )}
        </div>
      </div>

      {/* 主控制区域 */}
      <div className="flex flex-col items-center space-y-6 mb-8">
        {/* 录音按钮 */}
        <div className="relative">
          <Button
            size="lg"
            color={isRecording ? "danger" : "success"}
            onPress={toggleRecording}
            disabled={waitingForStop}
            className={`
              transition-all duration-300 ease-in-out
              ${
                isRecording
                  ? "w-48 rounded-full px-6 py-4"
                  : "w-16 h-16 rounded-full p-0"
              }
            `}
          >
            {!isRecording ? (
              <MicIcon size={24} />
            ) : (
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-white rounded-sm" />
                </div>

                {/* 音频波形 */}
                <div className="flex items-center">
                  <canvas
                    ref={canvasRef}
                    width={60}
                    height={30}
                    className="border rounded"
                  />
                </div>

                {/* 计时器 */}
                <span className="text-white font-mono text-sm">
                  {recordingTime}
                </span>
              </div>
            )}
          </Button>
        </div>

        {/* 设置按钮 */}
        <Button
          variant="ghost"
          onPress={() => setShowSettings(!showSettings)}
          startContent={<SettingsIcon size={16} />}
        >
          {showSettings ? "隐藏设置" : "显示设置"}
        </Button>

        {/* 设置面板 */}
        {showSettings && (
          <div className="w-full max-w-md space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                音频块大小 (ms)
              </label>
              <Select
                value={chunkDuration.toString()}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setChunkDuration(parseInt(value));
                }}
              >
                {chunkOptions.map((option) => (
                  <SelectItem key={option.value}>{option.label}</SelectItem>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WebSocket URL
              </label>
              <Input
                value={websocketUrl}
                onChange={(e) => setWebsocketUrl(e.target.value)}
                placeholder="ws://localhost:8000/asr"
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* 转录结果显示区域 */}
      <div className="bg-gray-50 rounded-lg p-6 min-h-96">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">转录结果</h3>

        {transcriptionLines.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {isRecording ? "等待语音输入..." : "点击开始按钮开始录音"}
          </div>
        ) : (
          <div className="space-y-4">
            {transcriptionLines.map((line, index) => {
              const timeInfo =
                line.beg !== undefined && line.end !== undefined
                  ? `${line.beg}s - ${line.end}s`
                  : "";

              return (
                <div key={index} className="border-l-4 border-blue-200 pl-4">
                  <div className="mb-2">
                    {renderSpeakerLabel(
                      line.speaker,
                      timeInfo,
                      line.speaker === 0
                    )}
                  </div>
                  <div className="text-gray-800 leading-relaxed">
                    {line.text || "..."}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 缓冲区状态 */}
        {bufferText && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <LoaderIcon className="w-4 h-4 animate-spin text-yellow-600" />
              <span className="text-yellow-700 text-sm">{bufferText}</span>
            </div>
          </div>
        )}
      </div>

      {/* 使用提示 */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        <p>• 首次使用需要授权麦克风权限</p>
        <p>• 确保 WebSocket 服务器正在运行</p>
        <p>• 建议使用耳机以获得更好的音频质量</p>
      </div>
    </div>
  );
};

export default LiveTranscription;
