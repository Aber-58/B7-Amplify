# consensus.io

Collective intelligence platform - Collect opinions, cluster similar ideas using AI, and visualize collective insights in real-time.

## Features

- 🎨 Hand-drawn aesthetic (ScribbleMind style)
- 📊 Real-time cluster visualization
- 💬 Interactive chat interface
- 📱 Fully responsive design
- 🔄 Real-time updates via WebSocket
- ♿ Accessibility compliant

## Quick Start

### Development

```bash
npm install
npm start
```

Visit `http://localhost:3000` and navigate to `/dev` for the showcase with mock data.

### Production Build

```bash
npm run build
```

## User Flow

1. **Admin** creates topic at `/admin`
2. **QR Code** shared via `/invite/:uuid`
3. **Participants** join via `/join/:uuid`
4. **Submit opinions** at `/poll/:uuid`
5. **View results** at `/live/:uuid` with cluster visualization

## Backend Integration

See [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) for complete API documentation.

### Quick Setup

1. Set backend API URL:
   ```env
   REACT_APP_API_URL=http://localhost:4200/api
   REACT_APP_WS_URL=ws://localhost:4200
   ```

2. Ensure backend implements required endpoints (see documentation)

3. Start backend server on port 4200

## Documentation

- **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)** - API endpoints and integration guide
- **[USER_FLOW.md](./USER_FLOW.md)** - Complete user journey documentation
- **[DEMO_WALKTHROUGH.md](./DEMO_WALKTHROUGH.md)** - Step-by-step demo guide

## Tech Stack

- React + TypeScript
- TailwindCSS
- Framer Motion
- RoughJS (hand-drawn graphics)
- d3-force (physics simulation)
- Zustand (state management)

## Project Structure

```
src/
├── components/      # UI components (CloudMap, ChatBox, etc.)
├── routes/          # Page components (Admin, Poll, Live, etc.)
├── service/         # API integration layer
├── store/           # Global state (Zustand)
├── lib/             # Utilities (motion, colors, websocket)
└── types/           # TypeScript declarations
```

## Demo Mode

Visit `/dev` to see all pages and components with mock data - no backend required!

## License

MIT