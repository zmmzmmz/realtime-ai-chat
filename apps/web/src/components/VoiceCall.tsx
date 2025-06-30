import React, { useState, useRef, useEffect } from "react";
import { Button } from "@heroui/react";
import {
  MicIcon,
  MicOffIcon,
  PhoneIcon,
  PhoneOffIcon,
  VolumeXIcon,
  Volume2Icon,
} from "lucide-react";

interface VoiceCallProps {
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onAudioData?: (audioData: Blob) => void;
}

export const VoiceCall: React.FC<VoiceCallProps> = ({
  onCallStart,
  onCallEnd,
  onAudioData,
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // 开始通话
  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setIsCallActive(true);
      setIsRecording(true);

      // 设置音频上下文用于可视化
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // 设置媒体录制器
      mediaRecorderRef.current = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        onAudioData?.(audioBlob);
      };

      mediaRecorderRef.current.start(100); // 每100ms记录一次

      // 开始音频级别监测
      monitorAudioLevel();

      onCallStart?.();
    } catch (error) {
      console.error("Error starting call:", error);
      alert("无法访问麦克风，请检查权限设置");
    }
  };

  // 结束通话
  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsCallActive(false);
    setIsRecording(false);
    setIsMuted(false);
    setAudioLevel(0);

    onCallEnd?.();
  };

  // 切换静音状态
  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // 监测音频级别
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(average / 255);

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  // 播放音频文件（暴露给外部使用）
  const playAudio = (audioBlob: Blob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  // 将播放函数暴露给外部
  React.useImperativeHandle(
    onAudioData as any,
    () => ({
      playAudio,
    }),
    []
  );

  // 清理资源
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      endCall();
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">语音通话</h2>
        <p className="text-gray-600">
          {isCallActive ? "通话进行中..." : "点击开始语音通话"}
        </p>
      </div>

      {/* 音频级别可视化 */}
      {isCallActive && (
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex space-x-1">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-8 rounded-full transition-all duration-150 ${
                  audioLevel * 10 > i
                    ? "bg-green-500 shadow-lg shadow-green-200"
                    : "bg-gray-300"
                }`}
                style={{
                  height: `${Math.max(8, audioLevel * 40 + Math.random() * 10)}px`,
                }}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-2">
            {isRecording ? "录音中" : "暂停"}
          </span>
        </div>
      )}

      {/* 主要控制按钮 */}
      <div className="flex space-x-4">
        {!isCallActive ? (
          <Button
            color="success"
            size="lg"
            onPress={startCall}
            className="flex items-center space-x-2 px-8 py-4"
            startContent={<PhoneIcon size={20} />}
          >
            开始通话
          </Button>
        ) : (
          <>
            <Button
              color="danger"
              size="lg"
              onPress={endCall}
              className="flex items-center space-x-2 px-8 py-4"
              startContent={<PhoneOffIcon size={20} />}
            >
              结束通话
            </Button>

            <Button
              color={isMuted ? "warning" : "default"}
              size="lg"
              onPress={toggleMute}
              className="flex items-center space-x-2 px-6 py-4"
              startContent={
                isMuted ? <MicOffIcon size={20} /> : <MicIcon size={20} />
              }
            >
              {isMuted ? "取消静音" : "静音"}
            </Button>
          </>
        )}
      </div>

      {/* 状态指示器 */}
      <div className="flex items-center space-x-4 text-sm">
        <div
          className={`flex items-center space-x-1 ${isCallActive ? "text-green-600" : "text-gray-400"}`}
        >
          <div
            className={`w-2 h-2 rounded-full ${isCallActive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
          />
          <span>{isCallActive ? "已连接" : "未连接"}</span>
        </div>

        {isCallActive && (
          <div
            className={`flex items-center space-x-1 ${isMuted ? "text-red-600" : "text-blue-600"}`}
          >
            {isMuted ? <VolumeXIcon size={16} /> : <Volume2Icon size={16} />}
            <span>{isMuted ? "已静音" : "正常"}</span>
          </div>
        )}
      </div>

      {/* 隐藏的音频元素用于播放 */}
      <audio ref={audioRef} className="hidden" controls />

      {/* 提示信息 */}
      <div className="text-xs text-gray-500 text-center max-w-md">
        <p>首次使用需要授权麦克风权限</p>
        <p>建议使用耳机以避免回声</p>
      </div>
    </div>
  );
};

export default VoiceCall;
