# HEVC Video Selector

A React Native application built with Expo for selecting, managing, and playing HEVC videos on iOS and Android devices.

## 🚀 Features

- **Video Selection**: Pick videos from the device gallery (optimized for HEVC on iOS).
- **Local Storage**: Save video metadata and manage local files.
- **Video Playback**: Built-in video player using `expo-av`.
- **State Management**: Efficient state handling with `zustand`.
- **File System**: Manage local video files using `expo-file-system`.

## 🛠 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Video Player**: [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/)
- **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/client) app on your physical device (optional but recommended for quick testing).
- **Android Studio** (for Android Emulator) or **Xcode** (for iOS Simulator - macOS only).

## 📦 Installation

1.  **Clone the repository** (if applicable) or navigate to the project directory:

    ```bash
    cd HEVC-video-app
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    # or
    yarn install
    ```

## 🏃‍♂️ Running the App

Start the development server:

```bash
npm start
# or
npx expo start
```

### Run on Android

-   **Physical Device**: Scan the QR code with the Expo Go app.
-   **Emulator**: Press `a` in the terminal after starting the server.

    ```bash
    npm run android
    ```

### Run on iOS

-   **Physical Device**: Scan the QR code with the Camera app.
-   **Simulator**: Press `i` in the terminal (macOS only).

    ```bash
    npm run ios
    ```

### Run on Web

Projects using Expo Router can also run on the web:

```bash
npm run web
```

## 📂 Project Structure

```
HEVC-video-app/
├── app/                 # Expo Router screens and layout
├── assets/              # Images, fonts, and other static assets
├── constants/           # App constants and configuration
├── store/               # Zustand state management stores
├── utils/               # Helper functions and utilities
├── components/          # Reusable UI components (if applicable)
├── app.json             # Expo configuration
├── package.json         # Dependencies and scripts
└── README.md            # Project documentation
```

## 📝 Notes

-   This app focuses on handling HEVC video files, particularly on iOS where this format is common.
-   Ensure you have configured the necessary permissions in `app.json` or `Info.plist` / `AndroidManifest.xml` for accessing the media library.
