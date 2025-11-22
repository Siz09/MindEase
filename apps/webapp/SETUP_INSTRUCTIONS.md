# Frontend Setup Instructions

## Installation

### 1. Install Dependencies

From the project root:

```bash
cd apps/webapp
npm install
```

This will install:

- Tailwind CSS 3.4.17
- Framer Motion 11.15.0
- Lucide React 0.468.0
- clsx & tailwind-merge
- PostCSS & Autoprefixer

### 2. Verify Configuration Files

Check that these files exist:

- ✅ `tailwind.config.js`
- ✅ `postcss.config.js`
- ✅ `src/styles/globals.css`
- ✅ `src/lib/utils.js`
- ✅ `src/components/ui/` directory

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` (or your configured port)

### 4. Verify Tailwind is Working

Add this to any component to test:

```jsx
<div className="bg-primary-500 text-white p-4 rounded-lg">Tailwind is working!</div>
```

You should see a blue box with white text.

## Component Usage

### Import and Use UI Components

```jsx
import Button from './components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/Card';
import Input from './components/ui/Input';
import Badge from './components/ui/Badge';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Example Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter text..." />
        <Button variant="primary" className="mt-4">
          Submit
        </Button>
        <Badge variant="success">New</Badge>
      </CardContent>
    </Card>
  );
}
```

### Use Utility Functions

```jsx
import { cn, formatDate, getMoodColor, truncate } from './lib/utils';

// Merge classes
const className = cn('base-class', condition && 'conditional-class');

// Format dates
const formatted = formatDate(new Date());

// Get mood styling
const moodClass = getMoodColor(4); // Returns 'mood-4'

// Truncate text
const short = truncate('Long text here...', 50);
```

## Framer Motion Usage

### Basic Animation

```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Animated content
</motion.div>;
```

### Page Transitions

```jsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
</AnimatePresence>;
```

### Stagger Children

```jsx
<motion.ul
  initial="hidden"
  animate="visible"
  variants={{
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }}
>
  {items.map((item) => (
    <motion.li
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

## Icon Usage (Lucide React)

```jsx
import { Heart, MessageCircle, AlertTriangle, Check, X, ChevronRight } from 'lucide-react';

<Button>
  <Heart className="h-4 w-4 mr-2" />
  Like
</Button>;
```

Browse icons: https://lucide.dev/icons/

## Troubleshooting

### Tailwind styles not applying

1. Check `main.jsx` imports `./styles/globals.css`
2. Restart dev server after config changes
3. Clear browser cache
4. Check console for errors

### Framer Motion not working

1. Ensure React 19+ compatibility
2. Check `prefersReducedMotion()` isn't blocking animations
3. Verify motion component props are correct

### Build errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# If still failing, check Node version
node --version  # Should be 18+
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Verify setup
3. ⏳ Migrate existing components to Tailwind
4. ⏳ Implement new chat UI components
5. ⏳ Add mood tracking UI
6. ⏳ Build guided program interface

## Resources

- [Design System Documentation](./DESIGN_SYSTEM.md)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
