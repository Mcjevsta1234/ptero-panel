# WitchyWorlds UI Component Library

A complete, production-ready UI component library designed for the WitchyWorlds theme redesign. All components use Tailwind CSS, Twin.macro, and embrace a nature-inspired, glass morphic design language.

## Design Principles

- **Nature-Inspired**: Forest colors, leaf patterns, organic shapes
- **Glass Morphism**: Transparency, backdrop blur, layered transparency
- **Bubbly**: Rounded corners (2rem border-radius), soft edges
- **Animated**: Smooth transitions, engaging keyframe animations
- **Accessible**: Dark/light mode support, focus states, semantic HTML

## Color System

### Primary Colors
- **Primary Blue**: `#3b82f6` (primary-500) - Main accent color
- **Primary Green**: `#10b981` (emerald-500) - Secondary accent
- **Primary Red**: `#ef4444` (red-500) - Danger states
- **Primary Gray**: `#6b7280` (gray-500) - Neutral text

### Nature Colors
- **Nature Green**: `#2d5016` - Forest dark green
- **Nature Leaf**: `#4a9d6f` - Leaf green accent
- **Nature Moss**: `#6b8e60` - Moss green
- **Nature Forest**: `#1a3a1a` - Deep forest

### Background & Text
- **Dark Mode**: `#0f1419` to `#1a2332` (gradient)
- **Light Mode**: `#fafbfc` to `#f3f4f6` (gradient)
- **Text Primary (Dark)**: `#e5e7eb`
- **Text Primary (Light)**: `#1f2937`

## Components

### 1. BubbleButton

Gradient button component with multiple variants and sizes.

```tsx
import { BubbleButton } from '@/witchyworlds/ui';

<BubbleButton
    variant="primary" // "primary" | "secondary" | "danger" | "success"
    size="md" // "sm" | "md" | "lg"
    disabled={false}
    onClick={() => {}}
>
    Click Me
</BubbleButton>
```

**Features:**
- 4 color variants with gradient backgrounds
- 3 size options (sm, md, lg)
- Disabled state with reduced opacity
- Active state with scale-95 animation
- Focus rings for accessibility
- Hover glow shadow effects
- Glass morphism borders (white/20)

**Variants:**
- `primary`: Blue gradient (primary-400 → primary-500 → primary-600)
- `secondary`: Gray gradient (gray-500 → gray-600 → gray-700)
- `danger`: Red gradient (red-500 → red-600 → red-700)
- `success`: Green gradient (emerald-500 → emerald-600 → emerald-700)

**Sizes:**
- `sm`: px-4 py-2 rounded-lg text-sm
- `md`: px-6 py-3 rounded-xl text-base
- `lg`: px-8 py-4 rounded-2xl text-lg

### 2. BubbleCard

Glass morphic card component with hover effects.

```tsx
import { BubbleCard } from '@/witchyworlds/ui';

<BubbleCard onClick={() => {}}>
    <h3>Card Title</h3>
    <p>Card content goes here</p>
</BubbleCard>
```

**Features:**
- Glass morphic background (white/5 with backdrop-blur-md)
- Transparent border (white/10, hover white/20)
- Rounded bubble styling (rounded-bubble = 2rem)
- Hover glow shadow (blue-500/20)
- Animated gradient overlay on hover
- Optional onClick handler
- Smooth transitions on all properties

**Styling:**
- Background: rgba(255, 255, 255, 0.05)
- Border: 1px rgba(255, 255, 255, 0.1)
- Border Radius: 2rem
- Backdrop Blur: 12px
- Hover Background: rgba(255, 255, 255, 0.08)

### 3. BubbleInput

Styled form input with optional icon and error state.

```tsx
import { BubbleInput } from '@/witchyworlds/ui';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

<BubbleInput
    label="Search"
    placeholder="Type here..."
    error={error}
    icon={<MagnifyingGlassIcon />}
    value={value}
    onChange={(e) => setValue(e.target.value)}
/>
```

**Features:**
- Optional label above input
- Optional error message below input
- Optional icon on the left
- Glass morphic styling
- Focus states with blue glow
- Smooth transitions
- Dark/light mode support

**Props:**
- `label?: string` - Label text above input
- `error?: string` - Error message to display
- `icon?: React.ReactNode` - Icon component on left
- All standard HTML input attributes

### 4. BubbleSelect

Styled select dropdown with optional label and error.

```tsx
import { BubbleSelect } from '@/witchyworlds/ui';

<BubbleSelect
    label="Choose Version"
    options={[
        { value: '1', label: 'Version 1.0' },
        { value: '2', label: 'Version 2.0' },
    ]}
    value={selected}
    onChange={(e) => setSelected(e.target.value)}
    error={error}
/>
```

**Features:**
- Optional label above select
- Optional error message below
- Chevron down icon (auto-added)
- Glass morphic styling
- Focus states with blue glow
- Custom option styling
- Dark/light mode support

**Props:**
- `label?: string` - Label text above select
- `error?: string` - Error message to display
- `options: Array<{ value: string | number; label: string }>` - Select options
- All standard HTML select attributes

### 5. BubbleModal

Glass morphic modal dialog with header, content, and footer.

```tsx
import { BubbleModal } from '@/witchyworlds/ui';

<BubbleModal
    isOpen={open}
    onClose={() => setOpen(false)}
    title="Confirm Action"
    size="md"
    footer={
        <>
            <BubbleButton variant="secondary" onClick={() => setOpen(false)}>
                Cancel
            </BubbleButton>
            <BubbleButton variant="primary" onClick={handleConfirm}>
                Confirm
            </BubbleButton>
        </>
    }
>
    <p>Are you sure you want to continue?</p>
</BubbleModal>
```

**Features:**
- Backdrop with dark overlay and blur
- Smooth slide-in animation
- Optional title with close button
- Optional footer for actions
- 3 size options (sm, md, lg)
- Glass morphic styling with gradients
- Click-outside to close (backdrop click)
- Smooth transitions

**Props:**
- `isOpen: boolean` - Control modal visibility
- `onClose: () => void` - Called when modal closes
- `title?: string` - Modal header title
- `children: React.ReactNode` - Modal content
- `footer?: React.ReactNode` - Footer actions
- `size?: "sm" | "md" | "lg"` - Modal width (default: "md")

**Sizes:**
- `sm`: max-w-sm (24rem)
- `md`: max-w-md (28rem)
- `lg`: max-w-lg (32rem)

### 6. ThemeModeSwitcher

Dark/light mode toggle button with persistence.

```tsx
import { ThemeModeSwitcher } from '@/witchyworlds/ui';

<ThemeModeSwitcher />
```

**Features:**
- Moon icon (dark mode) / Sun icon (light mode)
- Persists selection in cookies (365 days)
- CSS variable application per mode
- Glass morphic button styling
- Hover and active animations
- Responsive sizing
- Auto-detects system preference on first visit

**Dark Mode CSS Variables:**
- `--bg-primary`: #0f1419
- `--text-primary`: #e5e7eb
- Background colors adjusted for dark
- Text colors adjusted for dark

**Light Mode CSS Variables:**
- `--bg-primary`: #fafbfc
- `--text-primary`: #1f2937
- Background colors adjusted for light
- Text colors adjusted for light

## Animation System

All components include smooth animations defined in GlobalStylesheet:

### Keyframe Animations

- **float** (3s): Gentle floating up and down motion
- **glow** (2s): Pulsing shadow glow effect
- **shimmer** (2s): Shimmer across surface
- **slideIn** (0.5s): Slide in from bottom
- **fadeIn** (0.5s): Fade in from transparent

### Transition Durations

- Base: 300ms (default on most elements)
- Extended: 350ms (for complex transitions)
- Quick: 200ms (for interactive feedback)

## Dark/Light Mode Support

All components include full dark/light mode support via CSS variables:

```tsx
import { ThemeModeSwitcher } from '@/witchyworlds/ui';

// Add to main navigation or header
<ThemeModeSwitcher />
```

Components will automatically apply correct styling based on system preference and user selection.

## Tailwind Customization

The following custom Tailwind utilities are available:

```css
/* Border Radius */
rounded-bubble: 2rem
rounded-mega: 3rem

/* Shadows */
shadow-glow: 0 0 20px rgba(59, 130, 246, 0.5)
shadow-glow-lg: 0 0 40px rgba(59, 130, 246, 0.6)
shadow-bubble: 0 8px 32px rgba(31, 41, 55, 0.1)

/* Backdrop Blur */
backdrop-blur-xs: 2px

/* Animations */
animate-float: 3s float infinite
animate-glow: 2s glow infinite
animate-shimmer: 2s shimmer infinite
animate-slideIn: 0.5s slideIn
animate-fadeIn: 0.5s fadeIn

/* Typography */
font-heading: Poppins, system-ui (headers)
font-body: system-ui, sans-serif (body text)
```

## Usage Example: Complete Page

```tsx
import React, { useState } from 'react';
import tw from 'twin.macro';
import {
    BubbleButton,
    BubbleCard,
    BubbleInput,
    BubbleSelect,
    BubbleModal,
    ThemeModeSwitcher,
} from '@/witchyworlds/ui';

export const ExamplePage = () => {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div css={tw`max-w-6xl mx-auto px-4 py-8`}>
            {/* Header with Theme Switcher */}
            <div css={tw`flex justify-between items-center mb-8`}>
                <h1 css={tw`text-4xl font-bold text-neutral-100`}>Example Page</h1>
                <ThemeModeSwitcher />
            </div>

            {/* Search and Filter */}
            <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8`}>
                <BubbleInput
                    label="Search"
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <BubbleSelect
                    label="Category"
                    options={[
                        { value: 'all', label: 'All Categories' },
                        { value: 'featured', label: 'Featured' },
                    ]}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                />
            </div>

            {/* Content Cards */}
            <div css={tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8`}>
                {[1, 2, 3].map((id) => (
                    <BubbleCard key={id}>
                        <h3 css={tw`text-lg font-semibold text-neutral-100 mb-2`}>
                            Card {id}
                        </h3>
                        <p css={tw`text-neutral-400 mb-4`}>
                            Card content goes here with nice bubbly styling.
                        </p>
                        <BubbleButton
                            variant="primary"
                            size="sm"
                            onClick={() => setModalOpen(true)}
                        >
                            Learn More
                        </BubbleButton>
                    </BubbleCard>
                ))}
            </div>

            {/* Modal */}
            <BubbleModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="More Information"
                footer={
                    <>
                        <BubbleButton
                            variant="secondary"
                            onClick={() => setModalOpen(false)}
                        >
                            Close
                        </BubbleButton>
                        <BubbleButton variant="primary">
                            Continue
                        </BubbleButton>
                    </>
                }
            >
                <p css={tw`text-neutral-300 mb-4`}>
                    This is a modal with more detailed information.
                </p>
                <BubbleInput
                    label="Enter details"
                    placeholder="Type something..."
                />
            </BubbleModal>
        </div>
    );
};
```

## Integration Checklist

When adding WitchyWorlds components to existing pages:

- [ ] Import components from `@/witchyworlds/ui`
- [ ] Replace old button styles with `BubbleButton`
- [ ] Replace old card divs with `BubbleCard`
- [ ] Replace old inputs with `BubbleInput`
- [ ] Replace old selects with `BubbleSelect`
- [ ] Replace old dialogs with `BubbleModal`
- [ ] Add `ThemeModeSwitcher` to main navigation
- [ ] Test dark mode toggle
- [ ] Verify animations are smooth
- [ ] Check accessibility (focus states, contrast)
- [ ] Test on mobile (responsive grid adjustments)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid, Flexbox, Backdrop Filter support required
- CSS Variables support required
- Animations gracefully degrade on older browsers

## Performance Notes

- All animations use hardware acceleration (transform/opacity)
- Backdrop blur is GPU-accelerated on supported browsers
- Lazy-load animations with `prefers-reduced-motion`
- Smooth 60fps animations on modern devices
- Light performance footprint (~15KB minified)

## Future Enhancements

- [ ] Toast notifications (BubbleToast)
- [ ] Dropdown menus (BubbleDropdown)
- [ ] Tabs component (BubbleTabs)
- [ ] Accordion component (BubbleAccordion)
- [ ] Stepper component (BubbleStepper)
- [ ] Tooltip component (BubbleTooltip)
- [ ] Avatar component (BubbleAvatar)
- [ ] Badge component (BubbleBadge)
