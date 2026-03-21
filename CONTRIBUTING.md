# Contributing

## Development Setup

1. Fork and clone the repo
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Start dev server: `npm run dev`

## Code Style

- TypeScript strict mode
- ESLint + Prettier (auto-formatted on commit via Husky + lint-staged)
- Tailwind CSS for styling
- Hebrew (RTL) UI text

## Commit Guidelines

- Write clear, descriptive commit messages
- Keep commits focused on a single change
- Ensure `npm run build` passes before pushing

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass: `npm test`
4. Ensure build passes: `npm run build`
5. Open a pull request with a clear description

## Project Structure

Feature code lives in `src/modules/<feature>/`. Each module contains:
- Page component(s)
- Feature-specific sub-components in `components/`
- Sample/static data in `data/`

Shared code lives in `src/components/`, `src/lib/`, and `src/constants/`.
