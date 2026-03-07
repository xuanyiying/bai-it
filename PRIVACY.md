# Privacy Policy — 掰it

Last updated: 2026-03-02

## Summary

掰it is a browser extension that runs entirely on your device. It does not collect, transmit, or store any personal data on external servers.

## Data Storage

All data is stored locally on your device using Chrome's built-in storage APIs (chrome.storage and IndexedDB):

- **API Key**: Your LLM API key is stored locally and is only used to make requests directly from your browser to the LLM provider you choose. It is never sent to us or any third party.
- **Learning Data**: Your vocabulary records, chunking history, and learning progress are stored locally in IndexedDB. None of this data leaves your device.
- **Preferences**: Your settings (display options, etc.) are stored locally via chrome.storage.

## Network Requests

The only network requests this extension makes are from your browser directly to the LLM API provider (e.g., OpenAI, Anthropic) using the API key you provide. No data is sent to any server owned or operated by us.

## Third Parties

This extension does not use analytics, tracking, advertising, or any third-party services.

## Open Source

This extension is open source under the MIT License. You can inspect the full source code at: https://github.com/CapeAga/bai-it

## Contact

If you have questions about this privacy policy, please open an issue on the GitHub repository.
