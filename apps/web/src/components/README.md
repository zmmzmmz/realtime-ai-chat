# VoiceCall 语音通话组件

一个功能完整的 React 语音通话组件，支持实时语音录制、播放和可视化。

## 功能特性

- ✅ 开始/结束语音通话
- ✅ 实时音频级别可视化
- ✅ 静音/取消静音功能
- ✅ 音频录制和数据回调
- ✅ 音频播放功能
- ✅ 现代化 UI 设计
- ✅ 回声消除和噪音抑制
- ✅ 响应式设计

## 使用方法

```tsx
import { VoiceCall } from "./components/VoiceCall";

function App() {
  const handleCallStart = () => {
    console.log("通话开始");
  };

  const handleCallEnd = () => {
    console.log("通话结束");
  };

  const handleAudioData = (audioBlob: Blob) => {
    console.log("接收到音频数据:", audioBlob);
    // 处理音频数据，比如发送到服务器
  };

  return (
    <VoiceCall
      onCallStart={handleCallStart}
      onCallEnd={handleCallEnd}
      onAudioData={handleAudioData}
    />
  );
}
```

## Props

| 属性          | 类型                        | 描述                   | 可选 |
| ------------- | --------------------------- | ---------------------- | ---- |
| `onCallStart` | `() => void`                | 通话开始时的回调函数   | ✅   |
| `onCallEnd`   | `() => void`                | 通话结束时的回调函数   | ✅   |
| `onAudioData` | `(audioData: Blob) => void` | 接收音频数据的回调函数 | ✅   |

## 主要功能

### 1. 开始通话

- 请求麦克风权限
- 开始音频录制
- 显示实时音频级别
- 启用音频处理（回声消除、噪音抑制）

### 2. 结束通话

- 停止音频录制
- 释放媒体资源
- 重置组件状态

### 3. 静音控制

- 切换麦克风开关
- 保持通话连接状态

### 4. 音频可视化

- 实时显示音频输入级别
- 动态音频波形指示器

## 技术实现

- 使用 `MediaRecorder API` 进行音频录制
- 使用 `Web Audio API` 进行音频分析和可视化
- 支持现代浏览器的音频处理功能
- 响应式设计，适配不同屏幕尺寸

## 浏览器兼容性

- ✅ Chrome 47+
- ✅ Firefox 29+
- ✅ Safari 14+
- ✅ Edge 79+

## 注意事项

1. **权限要求**: 首次使用需要用户授权麦克风权限
2. **HTTPS要求**: 在生产环境中需要 HTTPS 协议
3. **耳机建议**: 建议使用耳机以避免音频反馈
4. **浏览器支持**: 需要支持 MediaRecorder 和 getUserMedia API
