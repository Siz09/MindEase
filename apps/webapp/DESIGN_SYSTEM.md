# MindEase Design System

## Overview

MindEase uses a calm, therapeutic design system optimized for mental health support. The color palette, typography, and components are carefully chosen to create a safe, welcoming, and non-judgmental environment.

## Technology Stack

- **CSS Framework**: Tailwind CSS 3.4.17
- **Animation Library**: Framer Motion 11.15.0
- **Icons**: Lucide React 0.468.0
- **Class Management**: clsx + tailwind-merge
- **Build Tool**: Vite 7.1.2

## Color Palette

### Primary (Blue) - Trust & Calm

Used for primary actions, links, and interactive elements.

- `primary-50` to `primary-950` - Full blue scale
- Default: `primary-500` (#0ea5e9)

### Calm (Teal) - Serenity & Balance

Used for secondary actions and calming UI elements.

- `calm-50` to `calm-950` - Full teal scale
- Default: `calm-500` (#14b8a6)

### Warm (Neutral Brown) - Comfort & Grounding

Used for backgrounds, borders, and neutral elements.

- `warm-50` to `warm-900` - Warm neutral scale

### Safety & Crisis Colors

- **Safety Yellow**: `safety` - For warnings and safety notices
- **Crisis Red**: `crisis` - For high-risk alerts

### Mood Scale Colors

- `mood-1` - Red (Very Bad)
- `mood-2` - Orange (Bad)
- `mood-3` - Yellow (Okay)
- `mood-4` - Lime (Good)
- `mood-5` - Green (Great)

## Typography

### Font Families

- **Sans**: Inter (body text) - Clean, highly readable
- **Display**: Poppins (headings) - Friendly, approachable

### Font Sizes (Tailwind defaults)

- `text-xs` - 0.75rem (12px)
- `text-sm` - 0.875rem (14px)
- `text-base` - 1rem (16px)
- `text-lg` - 1.125rem (18px)
- `text-xl` - 1.25rem (20px)
- `text-2xl` - 1.5rem (24px)
- `text-3xl` - 1.875rem (30px)

### Font Weights

- `font-normal` - 400
- `font-medium` - 500
- `font-semibold` - 600
- `font-bold` - 700

## Spacing

Extended spacing scale for generous, comfortable layouts:

- `space-18` - 4.5rem (72px)
- `space-88` - 22rem (352px)
- `space-128` - 32rem (512px)

## Border Radius

- `rounded-lg` - 0.5rem (8px) - Buttons, inputs
- `rounded-xl` - 0.75rem (12px) - Cards, modals
- `rounded-2xl` - 1rem (16px) - Large cards
- `rounded-4xl` - 2rem (32px) - Special elements

## Shadows

- `shadow-soft` - Subtle, soft shadow for cards
- `shadow-glow` - Blue glow effect
- `shadow-glow-calm` - Teal glow effect

## Animations

### Built-in

- `animate-fade-in` - Fade in (0.5s)
- `animate-slide-up` - Slide up from bottom (0.4s)
- `animate-slide-down` - Slide down from top (0.4s)
- `animate-scale-in` - Scale in (0.3s)
- `animate-pulse-slow` - Slow pulse (3s)
- `animate-breathe` - Breathing effect (4s) - For meditation UI

### Framer Motion

Use for more complex animations and page transitions.

## Component Library

### Buttons

**Primary Button**

```jsx
<Button variant="primary" size="md">
  Click Me
</Button>
```

**Variants**: `primary`, `secondary`, `ghost`, `danger`, `success`, `outline`
**Sizes**: `sm`, `md`, `lg`, `icon`
**States**: `disabled`, `loading`

### Cards

```jsx
<Card hover>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>
```

### Inputs

```jsx
<Input type="text" placeholder="Enter text..." error={false} />
```

### Badges

```jsx
<Badge variant="primary" size="md">
  New
</Badge>
```

**Variants**: `default`, `primary`, `success`, `warning`, `danger`, `calm`

## Utility Classes

### Custom Utilities

**Scrollbar**

```css
.scrollbar-thin
```

Thin, styled scrollbar for better UX.

**Transitions**

```css
.transition-smooth
```

Smooth 0.3s transitions with easing.

**Glass Morphism**

```css
.glass
```

Frosted glass effect with backdrop blur.

**Card Styles**

```css
.card          /* Base card */
.card-hover    /* Card with hover effect */
```

**Button Styles**

```css
.btn-primary
.btn-secondary
.btn-ghost
```

**Input Styles**

```css
.input
```

**Chat Bubbles**

```css
.chat-bubble-user  /* User message (blue, right) */
.chat-bubble-bot   /* Bot message (gray, left) */
```

**Safety Banners**

```css
.safety-banner-low      /* Blue */
.safety-banner-medium   /* Yellow */
.safety-banner-high     /* Orange */
.safety-banner-critical /* Red */
```

**Loading Skeleton**

```css
.skeleton
```

Animated loading placeholder.

**Focus Ring (Accessibility)**

```css
.focus-ring
```

Visible focus indicator for keyboard navigation.

## Usage Examples

### Chat Message

```jsx
<div className="flex items-start gap-3">
  <div className="chat-bubble-bot">
    <p>I'm here to listen and support you.</p>
  </div>
</div>

<div className="flex items-start gap-3 justify-end">
  <div className="chat-bubble-user">
    <p>Thank you for your support.</p>
  </div>
</div>
```

### Safety Banner

```jsx
<div className="safety-banner-high">
  <div className="flex items-start gap-3">
    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
    <div>
      <h4 className="font-semibold mb-1">We're concerned about you</h4>
      <p className="text-sm">If you're in crisis, please reach out to:</p>
      <ul className="mt-2 space-y-1">
        <li>National Suicide Prevention Lifeline: 988</li>
      </ul>
    </div>
  </div>
</div>
```

### Mood Rating

```jsx
<div className="flex gap-2">
  {[1, 2, 3, 4, 5].map((score) => (
    <button
      key={score}
      className={cn(
        'w-12 h-12 rounded-full font-semibold transition-smooth',
        getMoodColor(score),
        'hover:scale-110 focus:ring-2 focus:ring-offset-2'
      )}
    >
      {score}
    </button>
  ))}
</div>
```

### Guided Program Card

```jsx
<Card hover>
  <CardHeader>
    <CardTitle>Thought Reframing</CardTitle>
    <CardDescription>CBT exercise to challenge negative thoughts</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <span className="flex items-center gap-1">
        <Clock className="h-4 w-4" />7 min
      </span>
      <span className="flex items-center gap-1">
        <ListOrdered className="h-4 w-4" />7 steps
      </span>
    </div>
  </CardContent>
  <CardFooter>
    <Button variant="primary" className="w-full">
      Start Exercise
    </Button>
  </CardFooter>
</Card>
```

## Responsive Design

Use Tailwind's responsive modifiers:

- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+
- `2xl:` - 1536px+

Example:

```jsx
<div className="px-4 sm:px-6 lg:px-8">
  <h1 className="text-2xl sm:text-3xl lg:text-4xl">Title</h1>
</div>
```

## Dark Mode

Tailwind's dark mode is enabled with `class` strategy.

Add `dark:` prefix for dark mode styles:

```jsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Content</div>
```

**Note**: Dark mode toggle implementation pending.

## Accessibility

### Focus Indicators

Always visible for keyboard navigation:

```css
.focus-ring
```

### ARIA Labels

Always include for interactive elements:

```jsx
<button aria-label="Close modal">
  <X className="h-4 w-4" />
</button>
```

### Semantic HTML

Use proper semantic elements:

- `<nav>` for navigation
- `<main>` for main content
- `<article>` for independent content
- `<section>` for thematic grouping

### Motion Preferences

Respect reduced motion preferences:

```js
import { prefersReducedMotion } from './lib/utils';

const shouldAnimate = !prefersReducedMotion();
```

## Performance

### Tree Shaking

Tailwind automatically removes unused CSS in production.

### Class Merging

Use `cn()` utility to merge classes properly:

```js
import { cn } from './lib/utils';

const className = cn('base-classes', condition && 'conditional-classes', props.className);
```

### Lazy Loading

Use dynamic imports for heavy components:

```js
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

## Best Practices

1. **Consistent Spacing**: Use spacing scale (4, 8, 12, 16, 24, 32, 48, 64px)
2. **Limited Colors**: Stick to palette - don't add arbitrary colors
3. **Readable Text**: Minimum 16px font size, sufficient contrast
4. **Generous Touch Targets**: Minimum 44x44px for mobile
5. **Meaningful Animations**: Only animate when it aids comprehension
6. **Progressive Enhancement**: Core functionality works without JS
7. **Mobile First**: Design for mobile, enhance for desktop
8. **Calm Aesthetics**: Avoid aggressive colors, harsh contrasts
9. **White Space**: Use generous padding and margins
10. **Loading States**: Always show loading feedback for async operations

## File Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   └── Badge.jsx
│   └── ...
├── lib/
│   └── utils.js      # Utility functions
├── styles/
│   └── globals.css   # Global Tailwind styles
└── ...
```

## Adding New Components

1. Create in `src/components/ui/`
2. Use `cn()` for class management
3. Support dark mode with `dark:` prefix
4. Add proper TypeScript/PropTypes
5. Export as named export
6. Document in this file

## Future Enhancements

- [ ] Add animation variants library
- [ ] Create theme switcher component
- [ ] Add more icon components
- [ ] Create form validation components
- [ ] Add tooltip component
- [ ] Add modal/dialog component
- [ ] Add dropdown menu component
- [ ] Create date picker component

## Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Design Philosophy**: Every design decision should ask: "Does this help someone in distress feel safer, calmer, and more understood?"
