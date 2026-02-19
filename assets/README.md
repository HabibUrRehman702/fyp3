# Assets Needed for KneeKlinic Mobile App

## Required Assets

### 1. App Icon (icon.png)
- Size: 1024x1024px
- Format: PNG with transparency
- Design: KneeKlinic logo with knee icon
- Location: `mobile-app/assets/icon.png`

### 2. Splash Screen (splash.png)
- Size: 2048x2048px (will be resized)
- Format: PNG
- Design: KneeKlinic logo centered on dark blue background (#1e293b)
- Location: `mobile-app/assets/splash.png`

### 3. Adaptive Icon (Android) (adaptive-icon.png)
- Size: 1024x1024px
- Format: PNG with transparency
- Design: Foreground layer only (Android adds background)
- Location: `mobile-app/assets/adaptive-icon.png`

### 4. Favicon (favicon.png)
- Size: 48x48px
- Format: PNG
- Design: Small version of app icon
- Location: `mobile-app/assets/favicon.png`

## Current Status
All asset files are referenced in `app.json` but need to be created.

## Temporary Solution
For development, you can use placeholder images. The app will work with missing assets (Expo provides defaults).

## Creating Assets

### Using Design Tools:
1. **Figma/Canva**: Design your logo
2. **Export at required sizes**
3. **Place in `assets/` folder**

### Quick Placeholder (For Testing):
Create solid color images with text:
- Icon: 1024x1024 blue square with "KC" text
- Splash: 2048x2048 dark blue with "KneeKlinic" text

### Asset Generator Tools:
- [App Icon Generator](https://appicon.co/)
- [Expo Asset Generator](https://docs.expo.dev/guides/app-icons/)

## After Adding Assets

1. Place files in `assets/` folder
2. Ensure filenames match `app.json`:
   - `icon.png`
   - `splash.png`
   - `adaptive-icon.png`
   - `favicon.png`
3. Rebuild app: `npm start -c`

## Production Requirements

Before publishing to app stores, you MUST have:
- ✅ High-quality app icon (1024x1024)
- ✅ Splash screen (2048x2048)
- ✅ Screenshots (required for store listing)
- ✅ Feature graphic (for Android)

For now, the app will work fine without custom assets for development and testing.
