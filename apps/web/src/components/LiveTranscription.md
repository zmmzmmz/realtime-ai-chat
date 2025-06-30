# LiveTranscription 实时转录组件

基于 WhisperLiveKit 的实时语音转录 React 组件，提供完整的实时语音识别和转录功能。

## 功能特性

- ✅ 实时语音识别和转录
- ✅ WebSocket 连接管理
- ✅ 音频可视化波形显示
- ✅ 说话人识别和标记
- ✅ 可配置的音频块大小
- ✅ 实时状态监控
- ✅ 转录结果缓冲区管理
- ✅ 连接状态指示器
- ✅ 响应式设计
- ✅ 错误处理和重连机制

## 使用方法

```tsx
import { LiveTranscription } from "./components/LiveTranscription";

function App() {
  const handleTranscriptionUpdate = (data) => {
    console.log("转录更新:", data);
    // 处理转录数据
  };

  const handleConnectionChange = (connected) => {
    console.log("连接状态:", connected);
    // 处理连接状态变化
  };

  return (
    <LiveTranscription
      defaultWebSocketUrl="ws://localhost:8000/asr"
      onTranscriptionUpdate={handleTranscriptionUpdate}
      onConnectionChange={handleConnectionChange}
    />
  );
}
```

## Props

| 属性                    | 类型                                | 描述                        | 可选 |
| ----------------------- | ----------------------------------- | --------------------------- | ---- |
| `defaultWebSocketUrl`   | `string`                            | 默认的 WebSocket 服务器地址 | ✅   |
| `onTranscriptionUpdate` | `(data: TranscriptionData) => void` | 转录数据更新回调            | ✅   |
| `onConnectionChange`    | `(connected: boolean) => void`      | 连接状态变化回调            | ✅   |

## 数据结构

### TranscriptionData

```typescript
interface TranscriptionData {
  lines: TranscriptionLine[]; // 转录行数据
  buffer_transcription: string; // 转录缓冲区
  buffer_diarization: string; // 说话人识别缓冲区
  remaining_time_transcription: number; // 转录剩余时间
  remaining_time_diarization: number; // 说话人识别剩余时间
  status: string; // 当前状态
  type?: string; // 消息类型
}
```

### TranscriptionLine

```typescript
interface TranscriptionLine {
  speaker: number; // 说话人ID (-2: 静音, -1: 说话人1, 0: 处理中, >0: 其他说话人)
  text: string; // 转录文本
  beg?: number; // 开始时间
  end?: number; // 结束时间
}
```

## 主要功能

### 1. 录音控制

- **开始录音**: 点击录音按钮开始语音识别
- **停止录音**: 再次点击停止录音并处理最终结果
- **录音状态**: 实时显示录音时长和状态

### 2. 音频可视化

- **波形显示**: 实时显示音频输入波形
- **音频质量**: 显示音频输入质量指示器

### 3. 转录结果

- **实时转录**: 显示实时语音转录结果
- **说话人识别**: 自动识别不同说话人
- **缓冲区管理**: 处理转录和说话人识别的缓冲区数据

### 4. 连接管理

- **WebSocket 连接**: 管理与服务器的 WebSocket 连接
- **连接状态**: 显示连接状态指示器
- **自动重连**: 处理连接断开和重连逻辑

### 5. 配置选项

- **音频块大小**: 可配置的音频数据块大小 (500ms-5000ms)
- **WebSocket URL**: 可配置的服务器地址
- **设置面板**: 可展开/收起的设置面板

## 技术实现

### 音频处理

- 使用 `MediaRecorder API` 进行音频录制
- 使用 `Web Audio API` 进行音频分析和可视化
- 支持 WebM 音频格式

### WebSocket 通信

- 实时音频数据传输
- JSON 格式的转录结果接收
- 连接状态管理和错误处理

### 状态管理

- React Hooks 状态管理
- useRef 用于音频资源管理
- useCallback 用于性能优化

## 服务器要求

组件需要配合 WhisperLiveKit 服务器使用：

```bash
# 安装 WhisperLiveKit
pip install whisperlivekit

# 启动服务器
python -m whisperlivekit.server
```

默认服务器地址：`ws://localhost:8000/asr`

## 浏览器兼容性

- ✅ Chrome 47+
- ✅ Firefox 29+
- ✅ Safari 14+
- ✅ Edge 79+

## 注意事项

1. **权限要求**: 需要用户授权麦克风权限
2. **HTTPS要求**: 生产环境需要 HTTPS 协议
3. **服务器依赖**: 需要配合 WhisperLiveKit 服务器使用
4. **网络要求**: 需要稳定的网络连接进行实时数据传输
5. **音频质量**: 建议使用质量较好的麦克风设备

## 错误处理

组件包含完整的错误处理机制：

- **麦克风权限错误**: 显示权限请求提示
- **WebSocket 连接错误**: 显示连接失败信息
- **网络错误**: 自动重连机制
- **音频处理错误**: 资源清理和状态重置

## 性能优化

- **音频资源管理**: 自动清理音频上下文和流
- **内存管理**: 及时释放不需要的资源
- **渲染优化**: 使用 useCallback 减少重渲染
