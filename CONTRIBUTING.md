# Contributing to Agent Midas

Thank you for your interest in contributing to Agent Midas! This guide will walk you through the process from signup to payout.

## Getting Started

### 1. Create Your Account

1. Sign up at [agentmidas.xyz/signup](https://agentmidas.xyz/signup)
2. You automatically get a free affiliate account
3. Note your affiliate code for referral earnings

### 2. Sign the CLA

Before your first pull request can be reviewed, you must sign the [Contributor License Agreement](./CONTRIBUTOR_LICENSE_AGREEMENT.md).

### 3. Set Up Your Development Environment

```bash
# Fork this repository
# Clone your fork
git clone https://github.com/YOUR_USERNAME/agentmidasopendevteam.git

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### 4. Pick a Bounty

Browse the [BOUNTIES.md](./BOUNTIES.md) file for available bounties. Each bounty includes:
- App name and description
- Bounty amount ($50--$500)
- Difficulty level (Beginner/Intermediate/Advanced/Critical)
- Category

## Code Standards

### Design System

- **Background:** `#0A0A0A` (dark)
- **Gold accent:** `#D4AF37` (primary), `#E8C547` (light), `#B8860B` (dark)
- **Text:** `#F5F5F5` (primary), `#9CA3AF` (secondary), `#6B7280` (muted)
- **Borders:** `#2A2A2A`
- **Cards:** `#0D0D0D` background, `#141414` hover
- **Font:** Inter (body), JetBrains Mono (code)

### Component Patterns

```tsx
// Follow this component pattern
import { LucideIcon } from 'lucide-react';

export function MyComponent() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section content */}
      </div>
    </section>
  );
}
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `ContactManager.tsx`)
- API routes: `route.ts` in appropriate directory
- Utilities: `camelCase.ts`

### TypeScript

- Strict mode enabled
- No `any` types
- All props must be typed
- Export interfaces for shared types

### CSS / Tailwind

- Mobile-first (start with base, add `md:` and `lg:` breakpoints)
- Use the design system colors above (hardcoded hex values, not CSS variables for consistency)
- All interactive elements must have hover and focus states

### Zero Dependency Rule

**Do not add new npm packages without prior approval.** If you believe a new dependency is necessary:

1. Open an issue explaining why
2. Wait for approval from MIDAS PRIME
3. Only then add it to `package.json`

## Submission Process

### 1. Create a Feature Branch

```bash
git checkout -b bounty/XX-app-name
# Example: bounty/01-contact-management
```

### 2. Build Your App

- Follow the code standards above
- Ensure mobile responsiveness (375px+)
- Include loading states and error handling
- Test accessibility (keyboard navigation, screen reader)

### 3. Submit a Pull Request

Use the PR template. Your PR must include:

- [ ] Description of what was built
- [ ] Screenshots (desktop + mobile)
- [ ] Bounty number reference
- [ ] CLA signed
- [ ] No new dependencies added

### 4. Review Process

Your PR goes through the 6-layer security pipeline:

1. **CLA Check** -- Automated
2. **Automated Scan** -- Dependency audit
3. **Agent FORGE** -- Code quality review
4. **Agent CAPTAIN** -- Security audit
5. **Agent RADAR** -- UX review
6. **MIDAS PRIME** -- Final approval

### 5. Get Paid

Once approved and merged:
- Cash bounty deposited via Stripe
- Your app count increases toward next reward tier
- Affiliate commissions start on any referrals

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for community standards.

## Questions?

- Open an issue for technical questions
- Email dev@agentmidas.xyz for program questions
- Visit [agentmidas.xyz/developers](https://agentmidas.xyz/developers) for full program details
