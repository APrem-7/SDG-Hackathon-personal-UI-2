# ShipmentIQ Analytics Dashboard

A React-based analytics dashboard that replicates the ShipmentIQ Analytics interface with AI-powered features.

## Features

- **Modern Dashboard Layout**: Clean, professional interface matching the original design
- **Metrics Display**: Key performance indicators including total shipments, flow rates, unique products, and average quantities
- **AI Assistant Integration**: Interactive AI chat interface with suggested queries
- **Responsive Design**: Mobile-friendly layout that adapts to different screen sizes
- **Interactive Elements**: Clickable suggestion tags and functional input fields

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone or download this project
2. Navigate to the project directory:
   ```bash
   cd frontemnd
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   npm start
   ```

5. Open your browser and visit `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontemnd/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main component
│   ├── App.css         # Styling
│   └── index.js        # Entry point
├── package.json
└── README.md
```

## Features Overview

### Dashboard Components

1. **Header Navigation**
   - ShipmentIQ Analytics branding
   - Navigation tabs (Dashboard, AI Chat, Analytics)
   - Theme toggle button

2. **Metrics Cards**
   - Total Shipments
   - Average Flow Rate (highlighted in green)
   - Unique Products
   - Average Quantity

3. **AI Assistant**
   - Interactive input field
   - "Ask AI" button
   - Pre-defined query suggestions
   - Clickable suggestion tags

### Functionality

- **Interactive Input**: Users can type queries and press Enter or click "Ask AI"
- **Suggestion Clicks**: Clicking suggestion tags populates the input field
- **Responsive Design**: Layout adapts to mobile and desktop screens
- **Hover Effects**: Interactive elements have hover states for better UX

## Customization

### Styling
The entire design is customizable through `src/App.css`. Key areas include:
- Color scheme (easily changeable CSS variables could be added)
- Typography and spacing
- Card layouts and hover effects
- Responsive breakpoints

### Data Integration
To connect real data:
1. Replace the static `metrics` array in `App.js` with API calls
2. Implement the AI chat functionality in the `handleAskAI` function
3. Add chart libraries like Chart.js or D3.js for data visualization

### Additional Features
The foundation is set to easily add:
- Real-time data updates
- Chart visualizations
- User authentication
- Data filtering and sorting
- Export functionality

## Technologies Used

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and development server
- **CSS3**: Custom styling with flexbox and grid
- **JavaScript ES6+**: Modern JavaScript features

## Browser Support

This application supports all modern browsers including:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.