# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is **SoundChain**, a Next.js landing page for a Web3 music platform. The site features an interactive particle animation system, email signup functionality with progress tracking, and a modern gradient-based design aesthetic. The application is built with Next.js 15 using the App Router architecture.

## Development Commands

```bash
# Development with Turbopack (faster builds)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm lint
```

## Architecture & Key Components

### Application Structure
- **App Router**: Using Next.js 15 App Router (`app/` directory)
- **Single Page Application**: Primary content in `app/page.js`
- **API Route**: Email signup handler at `app/api/send/route.js`
- **Styling**: Tailwind CSS v4 with custom animations in `app/globals.css`

### Core Systems

#### 1. Particle Animation System
The application features a sophisticated multi-layer particle animation system:
- **Three canvas layers**: `particles-background`, `particles`, and `extra-particles`
- **Interactive particles**: Mouse attraction with idle release mechanism (20s timeout)
- **Performance optimized**: Device pixel ratio capping, efficient requestAnimationFrame loops
- **Responsive**: Auto-resizes on window changes with event cleanup

#### 2. Email Signup & Progress Tracking
- **API Integration**: Uses Resend for email delivery (`RESEND_API_KEY` required)
- **Progress Bar**: Animated progress visualization with 5000 signup goal
- **Toast Notifications**: Custom toast system for user feedback
- **Email Templates**: HTML email templates with brand styling

#### 3. Animation & Visual Effects
- **AOS (Animate On Scroll)**: Extensive scroll-triggered animations with mobile performance optimization
- **Hero Reveal**: Gated content reveal system triggered by user interaction
- **Custom CSS Animations**: Gradient backgrounds, glow effects, and particle connections
- **Theme System**: CSS custom properties with dark theme support

### Technology Stack
- **Framework**: Next.js 15.4.5 with React 19.1.0
- **Styling**: Tailwind CSS v4 with PostCSS
- **Animations**: AOS library + custom CSS animations
- **Email**: Resend API integration
- **Development**: ESLint with Next.js rules, Turbopack for dev server

## Environment Requirements

### Required Environment Variables
```bash
RESEND_API_KEY=your_resend_api_key_here
```

### Dependencies
- **Core**: Next.js, React, React DOM
- **Animations**: AOS (Animate On Scroll)
- **Email**: Resend API client
- **Styling**: Tailwind CSS with PostCSS plugin

## Development Notes

### Performance Considerations
- **Device Pixel Ratio**: Capped at 1.5 for particle canvases to prevent performance issues
- **Animation Optimization**: Uses `will-change` properties and `requestAnimationFrame`
- **Mobile Optimizations**: AOS animations disabled on screens < 1024px width
- **Event Cleanup**: All event listeners properly removed in useEffect cleanup

### Code Patterns
- **Client Components**: All interactive components use `"use client"` directive
- **Canvas Management**: Separate canvas contexts with proper cleanup and resize handling
- **State Management**: Local React state for UI interactions, no external state management
- **Error Handling**: Comprehensive try-catch blocks in API routes and async operations

### API Behavior
- **Email Endpoint**: `/api/send` accepts POST for signups, GET for count retrieval
- **Response Format**: Consistent JSON responses with error handling
- **Cache Control**: No-store cache headers for dynamic content

## Common Development Tasks

### Adding New Animations
- Extend AOS configuration in the main useEffect
- Add custom CSS animations in `globals.css`
- Use the existing particle system patterns for consistency

### Modifying Email Templates
- Edit the `getWelcomeEmailHtml` function in `app/api/send/route.js`
- Update asset URLs for production deployment
- Test email rendering across clients

### Performance Debugging
- Use browser DevTools Performance tab with particle animations
- Check canvas resize behavior on different screen sizes
- Monitor memory usage with multiple particle systems

### Styling Updates
- Modify Tailwind classes directly in JSX
- Add custom animations to `globals.css` following existing patterns
- Update CSS custom properties in `:root` for theme changes
