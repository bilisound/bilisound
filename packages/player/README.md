# bilisound-player

A comprehensive audio player Expo module designed for audio content playback in React Native applications. This module provides a full-featured audio player implementation with support for playlist management and background playback.

It's exclusively designed for use with [Bilisound](https://bilisound.moe). Although this library does not contain any business logic, it may not suitable for everyone's needs. For a more versatile audio playback solution, you may want to consider [React Native Track Player](https://rntp.dev/).

## Features

- Complete audio playback control (play, pause, seek, next/previous track)
- Playlist management with queue support
- Repeat mode control
- Playback speed adjustment with pitch control
- Background playback support
- Customizable network headers
- Cross-platform support (iOS, Android, Web)

## Installation

### In managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation).

### In bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

#### Add the package to your npm dependencies

```bash
npm install @bilisound/player
```

#### Configure for iOS

Run `npx pod-install` after installing the npm package.

#### Configure for Android

No additional configuration required for Android.

## Basic Usage

```typescript
import * as Player from "@bilisound/player";

// Play a track
await Player.play();

// Pause playback
await Player.pause();

// Add a track to the playlist
await Player.addTrack({
  title: "Track Title",
  artist: "Artist Name",
  uri: "https://example.com/audio.mp3",
});

// Control playback speed
await Player.setSpeed(1.5, true); // 1.5x speed with pitch retention
```
