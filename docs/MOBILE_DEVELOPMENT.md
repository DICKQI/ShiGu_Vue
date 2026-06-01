# 移动端开发（Capacitor）

本项目使用 Capacitor 将 Vue/Vite 应用打包到原生移动端。当前仓库依赖中已包含 Android 平台能力；iOS 可按需额外安装 `@capacitor/ios` 后接入。

## 当前配置

配置文件：`capacitor.config.ts`

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pickgoods.app',
  appName: '拾谷',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true
  }
};

export default config;
```

说明：

| 字段 | 说明 |
|------|------|
| `appId` | Android/iOS 应用唯一标识 |
| `appName` | 设备上显示的应用名 |
| `webDir` | Web 构建产物目录 |
| `androidScheme` | Android WebView scheme |
| `cleartext` | 允许 HTTP 请求，开发环境方便调试；生产环境建议使用 HTTPS |

## 已安装依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `@capacitor/core` | `^8.0.0` | Capacitor 核心 |
| `@capacitor/cli` | `^8.0.0` | Capacitor CLI |
| `@capacitor/android` | `^8.0.0` | Android 平台 |
| `@capacitor/status-bar` | `^8.0.0` | 状态栏控制 |
| `@capacitor/network` | `^8.0.0` | 网络状态 |
| `@capacitor/camera` | `^8.0.0` | 原生相机与相册 |
| `@capacitor-community/http` | `^1.4.1` | 原生 HTTP 能力 |

项目还通过 `patch-package` 对 `@capacitor-community/http@1.4.1` 应用了补丁，补丁文件位于 `patches/`。

## Android 开发环境

需要安装：

- JDK 17 或更新的兼容版本
- Android Studio
- Android SDK、Build Tools、Platform Tools
- 可选：Android Emulator

Windows 常见环境变量：

```powershell
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Java\jdk-17
PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
```

## Android 初始化

如果仓库中尚未生成 `android/` 目录：

```bash
pnpm build
pnpm exec cap add android
pnpm exec cap sync android
```

之后打开 Android Studio：

```bash
pnpm exec cap open android
```

## Android 开发流程

每次修改 Web 代码并需要同步到原生项目：

```bash
pnpm build
pnpm exec cap sync android
```

调试方式：

- Android Studio Logcat 查看原生日志
- Chrome 打开 `chrome://inspect` 调试 WebView

## Live Reload

开发时可以让原生壳加载 Vite 开发服务器：

```bash
# 终端 1
pnpm dev -- --host 0.0.0.0

# 终端 2
pnpm exec cap run android -l --external
```

注意：

- 手机和电脑需要在同一网络
- 防火墙需要允许 Vite 端口访问
- 真机后端地址不能使用 `localhost`，请使用电脑局域网 IP 或测试域名

## 构建 APK / AAB

生成原生项目后，可在 Android Studio 中：

- Build APK
- Generate Signed Bundle / APK

也可以进入 `android/` 目录使用 Gradle：

```bash
cd android
.\gradlew.bat assembleDebug
```

macOS/Linux：

```bash
cd android
./gradlew assembleDebug
```

## iOS 可选接入

当前 `package.json` 未安装 `@capacitor/ios`。如需 iOS：

```bash
pnpm add @capacitor/ios
pnpm build
pnpm exec cap add ios
pnpm exec cap sync ios
pnpm exec cap open ios
```

iOS 需要 macOS、Xcode 和 CocoaPods。打开项目时应使用 `ios/App/App.xcworkspace`。

## 原生功能

### 状态栏

`src/main.ts` 中仅在原生平台初始化状态栏：

```ts
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false }).then(() => {
    StatusBar.setStyle({ style: Style.Light })
    StatusBar.setBackgroundColor({ color: '#FFFFFF' })
  })
}
```

### 相机与图片

谷子表单支持：

- 原生相机拍照
- 选择图片
- 上传前裁剪
- 主图和补充图片上传

Android 权限示例：

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

iOS 如接入，需要在 `Info.plist` 中配置：

```xml
<key>NSCameraUsageDescription</key>
<string>需要访问相机以拍摄藏品照片</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>需要访问相册以选择照片</string>
```

## API 地址注意事项

移动端生产包不要使用：

```text
http://127.0.0.1:8000
http://localhost:8000
```

这些地址会指向手机自身。请使用：

- `http://电脑局域网IP:8000`
- 测试服务器域名
- 生产 HTTPS API 域名

可通过两种方式配置：

```bash
VITE_API_BASE_URL=https://api.example.com pnpm build
```

或在应用设置页中填写后端地址。

## 常用命令

```bash
pnpm exec cap sync
pnpm exec cap sync android
pnpm exec cap copy android
pnpm exec cap open android
pnpm exec cap run android
pnpm exec cap run android -l --external
```

## 常见问题

### Android 提示 SDK location not found

检查 `ANDROID_HOME` 是否指向 Android SDK 目录，并确认 `platform-tools` 已加入 `PATH`。

### 真机无法连接后端

检查：

- 后端地址是否是手机可访问地址
- 电脑和手机是否在同一网络
- 后端是否监听 `0.0.0.0`
- 防火墙是否放行端口
- 生产环境是否使用 HTTPS 或已允许明文 HTTP

### 相机不可用

检查：

- `@capacitor/camera` 是否已安装
- 是否执行过 `pnpm exec cap sync`
- Android/iOS 权限是否配置
- 尽量在真机测试，相机在模拟器中可能不可用

### Live Reload 不刷新

检查：

- `pnpm dev -- --host 0.0.0.0` 是否正常启动
- 手机是否能访问 Vite 地址
- 防火墙是否拦截
- `pnpm exec cap run android -l --external` 是否使用了正确网卡地址
