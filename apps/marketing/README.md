# MindEase Marketing Site

A modern, bilingual marketing website for MindEase — an AI-powered mental wellness companion built specifically for Nepal.

## Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Bilingual Support**: Full English and Nepali translations using i18next
- **Modern Animations**: Smooth, performant animations with Framer Motion
- **SEO Optimized**: Meta tags and structured data with React Helmet
- **Accessible**: WCAG 2.1 compliant with proper ARIA labels
- **Dark Theme**: Eye-friendly dark mode design

## Project Structure

\`\`\`
apps/marketing/
├── src/
│ ├── components/ # Reusable UI components
│ │ ├── Navbar.jsx
│ │ ├── Footer.jsx
│ │ ├── Hero.jsx
│ │ ├── BentoGrid.jsx
│ │ ├── BentoCard.jsx
│ │ ├── Section.jsx
│ │ ├── LanguageSwitcher.jsx
│ │ └── FeatureIcon.jsx
│ ├── routes/ # Page components
│ │ ├── Home.jsx
│ │ ├── Features.jsx
│ │ ├── WhyMindease.jsx
│ │ ├── About.jsx
│ │ └── Contact.jsx
│ ├── i18n/ # Internationalization setup
│ │ └── index.js
│ ├── locales/ # Translation files
│ │ ├── en/
│ │ │ └── common.json
│ │ └── ne/
│ │ └── common.json
│ ├── App.jsx # Main app component with routing
│ ├── main.jsx # Entry point
│ └── index.css # Global styles with Tailwind directives
├── public/
│ ├── favicon.ico
│ ├── robots.txt
│ └── sitemap.xml
├── tailwind.config.js # Tailwind configuration (marketing-only)
├── postcss.config.js # PostCSS configuration
├── vite.config.js # Vite configuration
└── package.json
\`\`\`

## Technology Stack

- **React 19**: Modern UI library
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **i18next**: Internationalization framework
- **React Router v7**: Client-side routing
- **React Helmet Async**: SEO meta tags management
- **Lucide React**: Icon library

## Installation

1. Navigate to the marketing app directory:
   \`\`\`bash
   cd apps/marketing
   \`\`\`

2. Install dependencies (handled by monorepo):
   \`\`\`bash
   npm install
   \`\`\`

## Development

Start the development server:

\`\`\`bash
npm run -w @mindease/marketing dev
\`\`\`

The site will be available at `http://localhost:5173`

**Note**: The marketing app runs on port 5173, while the webapp runs on port 5174 to avoid conflicts.

## Building

Build the static site for production:

\`\`\`bash
npm run -w @mindease/marketing build
\`\`\`

Preview the production build:

\`\`\`bash
npm run -w @mindease/marketing preview
\`\`\`

## Adding New Pages

1. Create a new component in `src/routes/`:
   \`\`\`jsx
   import { Helmet } from '@dr.pogodin/react-helmet';
   import { useTranslation } from 'react-i18next';
   import Section from '../components/Section';

   export default function NewPage() {
   const { t } = useTranslation();

   return (
   <>
   <Helmet>
   <title>MindEase — Page Title</title>
   <meta name="description" content="Page description" />
   </Helmet>
   <Section>
   {/_ Page content _/}
   </Section>
   </>
   );
   }
   \`\`\`

2. Add the route in `src/App.jsx`:
   \`\`\`jsx
   import NewPage from './routes/NewPage';

   <Route path="/new-page" element={<NewPage />} />
   \`\`\`

3. Add navigation link in `src/components/Navbar.jsx` if needed.

## Adding Translations

1. Add English strings to `src/locales/en/common.json`:
   \`\`\`json
   {
   "page.title": "Your English Title",
   "page.description": "Your English description"
   }
   \`\`\`

2. Add Nepali translations to `src/locales/ne/common.json`:
   \`\`\`json
   {
   "page.title": "तपाईंको नेपाली शीर्षक",
   "page.description": "तपाईंको नेपाली विवरण"
   }
   \`\`\`

3. Use in components:
   \`\`\`jsx
   const { t } = useTranslation();
   <h1>{t('page.title')}</h1>
   \`\`\`

## Styling

- **Theme Colors**: Defined in `src/index.css` and `tailwind.config.js`
- **Breakpoints**: Mobile-first design with `sm:`, `md:`, `lg:` prefixes
- **Dark Mode**: All components use dark theme by default
- **Custom Classes**: Bento-style rounded corners with `rounded-2xl`

### Color Palette

- **Background**: `#0f172a` (slate-950)
- **Surface**: `rgba(15, 23, 42, 0.5)` (slate-900/50)
- **Accent**: `#0ea5e9` (sky-500)
- **Text**: White for primary, slate-300/400 for secondary

## Important Notes

1. **Tailwind Scope**: Tailwind CSS is scoped to the marketing app only. Do NOT add Tailwind to `apps/webapp` or `packages/ui`.

2. **No Shared Styles**: All styling for the marketing site uses classes within this app. No changes to the root or shared packages.

3. **No Breaking Changes**: This marketing site does not import or depend on any code from `apps/webapp`.

4. **Environment Variables**:
   - `VITE_MINDEASE_APP_URL`: The base URL for the MindEase webapp.
     - Default: `http://localhost:5174` (webapp runs on port 5174 to avoid conflicts with marketing on 5173)
     - Set this to your production webapp URL when deploying
     - A `.env` file is automatically created with the correct local development URL
     - For production, update `.env` with: `VITE_MINDEASE_APP_URL=https://your-webapp-url.com`

## SEO & Performance

- Each page includes proper Helmet meta tags
- Responsive images with proper alt text
- Lazy loading of components with Framer Motion's `whileInView`
- Optimized animations with `once: true` to prevent re-triggering

## Accessibility

- Semantic HTML with proper heading hierarchy
- ARIA labels on interactive elements
- Language switcher with proper labeling
- Keyboard navigation support
- Focus states on all interactive elements

## Deployment

Build artifacts are generated in the `dist/` directory:

\`\`\`bash
npm run -w @mindease/marketing build
\`\`\`

These can be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

## Troubleshooting

### Tailwind styles not appearing

- Ensure `src/index.css` has Tailwind directives
- Verify `tailwind.config.js` content path includes all JSX files
- Check that PostCSS is configured properly

### Translations not updating

- Reload the page (translations are cached in localStorage)
- Check browser console for i18next warnings
- Verify JSON syntax in translation files

### Animations stuttering

- Reduce animation complexity
- Check browser DevTools for performance issues
- Consider using `will-change` for complex animations

## Contributing

When adding new features:

1. Keep components small and focused
2. Always provide both EN and NE translations
3. Test on mobile devices
4. Ensure proper accessibility
5. Add appropriate meta tags for SEO

## License

Part of the MindEase project. All rights reserved.
