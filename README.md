# Podclass

A modern podcast learning platform that helps you discover, learn from, and engage with podcast content. Built with React, TypeScript, and Supabase.

## Features

- 🎧 Search podcasts by name, topic, or URL
- 🌍 Filter by language and country
- 📚 Generate educational lessons from podcast episodes
- 💬 Interactive Q&A with episode transcripts
- 📱 Fully responsive design
- 🎨 Beautiful dark mode UI
- 🔍 Advanced search capabilities

## Tech Stack

- **Frontend:**
  - React
  - TypeScript
  - TailwindCSS
  - Shadcn/ui Components
  - Lucide Icons

- **Backend:**
  - Supabase (Database & Authentication)
  - Edge Functions
  - Podcast Index API

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/podcast-pulse.git
cd podcast-pulse
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Supabase and Podcast Index API credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
PODCAST_INDEX_API_KEY=your_podcast_index_api_key
PODCAST_INDEX_API_SECRET=your_podcast_index_api_secret
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── integrations/  # External service integrations
├── lib/          # Utility functions and helpers
├── styles/       # Global styles and Tailwind config
└── types/        # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
