# Wiki Application

A simple multi-user wiki application built with Next.js, BetterAuth, Drizzle ORM, and Neon Postgres.

## Features

- **Multi-user support**: Users can sign up and sign in with email/password
- **Article management**: Create, edit, and view articles with markdown support
- **Tagging system**: Organize articles with tags (many-to-many relationship)
- **Access control**: Users can only edit their own articles
- **Public viewing**: Anyone can browse and read articles without logging in

## Tech Stack

- **Next.js 15** - React framework with App Router
- **BetterAuth** - Authentication library
- **Drizzle ORM** - TypeScript ORM for database
- **Neon Postgres** - Serverless Postgres database
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Styling
- **React Markdown** - Markdown rendering
- **Playwright** - E2E testing

## Setup

### Prerequisites

- Node.js 20 or higher
- A Neon Postgres database account

### Installation

1. Clone or navigate to the project directory:

```bash
cd wiki
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following:

```env
DATABASE_URL=your-neon-connection-string-here
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000
```

You can generate a secret with:

```bash
openssl rand -base64 32
```

4. Run database migrations:

```bash
npm run db:migrate
```

Or push the schema directly (for development):

```bash
npm run db:push
```

**Note**: A new tagging system migration was added. See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for details on the tagging system and migration.

### Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

Run Playwright tests:

```bash
npm test
```

Run tests in UI mode:

```bash
npm run test:ui
```

## Project Structure

```
wiki/
├── app/
│   ├── actions/          # Server actions
│   ├── api/auth/         # Auth API routes
│   ├── article/          # Article pages
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   ├── page.tsx          # Home page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # shadcn UI components
│   ├── article-form.tsx  # Article form component
│   ├── article-list.tsx  # Article list component
│   ├── auth-button.tsx   # Auth button component
│   └── markdown-renderer.tsx
├── db/
│   ├── schema.ts         # Database schema (includes tags & article_tags)
│   └── index.ts          # Database client
├── lib/
│   ├── auth.ts           # Auth server config
│   ├── auth-client.ts    # Auth client
│   └── utils.ts          # Utility functions
├── tests/
│   └── wiki.spec.ts      # E2E tests
├── drizzle/
│   └── migrations/       # Database migrations
└── package.json
```

## Usage

### As a Visitor

- Browse all articles on the home page
- Click on article titles to read the full content
- View markdown-formatted articles

### As a User

1. **Sign Up**: Click "Sign Up" and create an account
2. **Sign In**: Use your email and password to sign in
3. **Create Article**: Click "Create Article" on the home page
4. **Edit Article**: Click "Edit" on articles you've created
5. **Sign Out**: Click "Sign Out" to end your session

## Code Quality

The project uses:

- **Prettier** - Code formatting with minimal configuration
- **Biome** - Linting for correctness (not style)

## License

MIT
