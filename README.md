# TabMagnet - New Tab Position Controller

Chrome extension for configuring new tab positions in browser windows with multilingual support.

## Key Features
- Customizable new tab positions:
  - Right side of current tab (default)
  - Left side of current tab 
  - Far left in window
  - Far right in window (browser default)
- Multilingual interface (English/Chinese/Japanese)
- Automatic preference saving
- Responsive options page

## Project Structure
TabMagnet/
├── _locales/
│   ├── en/                 # English locale
│   ├── zh_CN/              # Simplified Chinese
│   └── ja/                 # Japanese locale
├── images/                 # Extension icons
├── background.js           # Background logic
├── manifest.json           # Extension manifest  
├── options.html            # Options page
├── options.css             # Options page styles
└── options.js              # Options page logic

## Installation
```bash
# Load unpacked extension
1. Open Chrome extensions page: chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this repository directory

## Localization Support
Available languages:

- English (en)
- Simplified Chinese (zh_CN)
- Japanese (ja)

How to switch languages:
1. Click extension icon in toolbar
2. Select language from dropdown
3. Interface updates immediately

## Technical Details
- Chrome Manifest V3 compliant
- Uses <mcsymbol name="chrome.tabs.onCreated" filename="background.js" path="/Users/ben/Next Tab/TabMagnet/background.js" startline="1" type="function"></mcsymbol> for tab creation events
- Syncs settings via <mcsymbol name="chrome.storage.sync" filename="options.js" path="/Users/ben/Next Tab/TabMagnet/options.js" startline="3" type="function"></mcsymbol>
- Responsive layout (min-width: 300px)

## Contributing
Welcome contributions via Issues:
- New translations (update `_locales/` directory)
- Feature requests
- Bug reports

## License
MIT License

```plaintext

Key Implementation Notes:
1. Localization based on `_locales/` directory structure
2. Core logic in `background.js`
3. Options page uses `flex` layout (see `options.css`)

Recommended to include extension screenshot at `images/screenshot.png`.