# Nexora AI

A premium AI chat workspace built with Next.js and NVIDIA NIM.

**Developer:** Arslan /editz900s

## Features

- Real-time streaming AI responses
- Secure server-side NVIDIA API integration
- Persistent local conversations with search, pinning, renaming, and deletion
- Markdown, tables, and syntax-highlighted code with copy controls
- Live NVIDIA free-model catalog with searchable model picker
- Auto mode with failover across available models
- Multiple response styles
- Voice dictation and text/code file attachments
- Light, dark, and system themes
- Export conversations to Markdown
- Responsive mobile and desktop layouts

## Local development

1. Copy `.env.example` to `.env.local` and add your NVIDIA API key.
2. Run `npm install` and `npm run dev`.
3. Open `http://localhost:3000`.

The NVIDIA key is used only in `app/api/chat/route.js` and is never sent to the browser. Conversations are stored in your browser's local storage.
