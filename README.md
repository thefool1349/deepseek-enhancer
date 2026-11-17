# DeepSeek Enhancer

A lightweight, powerful Firefox extension designed to supercharge your prompting workflow.

Built from scratch to fix the annoying parts of DeepSeek and add missing features that power users need—all while keeping your data 100% local.

## Features

- **Auto-Collapse Thoughts:** Instantly hides what deepseek is thinking.
- **Cookie Banner Killer:** Permanently removes the annoying "Please check your browser extensions" warning banner.
- **Custom Prompt Library:** Save your favorite system prompts and instructions right inside the extension popup.
- **⭐Default Instruction:** Star any saved instruction to make it the "Default Persona." This locked instruction will automatically be attached to every message you send.
- **`:::` Autocomplete Trigger:** Type `:::` in the chat box to instantly summon a menu of your saved instructions. Use your arrow keys to filter and select.
- **Visual "Chip" System:** Selected instructions appear as clean, removable chips above the input box, mimicking DeepSeek's native UI (like the "Web Search" button).
- **The Send Hijack:** Behind the scenes, the extension seamlessly combines your active chips, your default persona, and your typed message into one final prompt when you hit Enter.

## How It Works

1. **Manage your Prompts:** Click the extension icon in your toolbar. Click `+ Add Instruction` to save a new prompt. Use the ⭐ button to set a default.
2. **Trigger Prompts on the Fly:** In the DeepSeek chat box, type `:::` followed by the first letter of your instruction (e.g., `:::co` for "Code Reviewer").
3. **Select & Chat:** Click it to select. The prompt is turned into a chip above the chat box. Type your message and hit send.

## Privacy & Permissions

We believe in absolute privacy. **DeepSeek Enhancer does not collect, track, or transmit any data.**

- Your custom instructions are saved locally on your machine using Firefox's `browser.storage.local`.
- The extension only activates on `https://chat.deepseek.com/` and does not read any other tabs or browsing history.

## Local Development / Manual Installation

If you want to load this extension manually (e.g., for development or to use the latest source code):

1. Clone this repository or download the source code folder.
2. Open Firefox and navigate to `about:debugging`.
3. Click **"This Firefox"** in the left sidebar.
4. Click **"Load Temporary Add-on..."**
5. Select the `manifest.json` file inside the project folder.

_(Note: Because this is loaded temporarily, Firefox will remove the extension when you close the browser. You will need to repeat these steps or install it via the official Add-ons store once published)._

---

**Disclaimer:** This extension is an independent project and is not affiliated with, endorsed by, or sponsored by DeepSeek.
