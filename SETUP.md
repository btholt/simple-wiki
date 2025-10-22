# Quick Start Guide

## Before You Begin

You need:

1. A Neon Postgres database connection string
2. Node.js 20+ installed

## Step-by-Step Setup

### 1. Add your Neon connection string

The user mentioned they already added the connection string to `.env.local`. Make sure it's set:

```bash
# Check if .env.local exists
cat .env.local
```

Your `.env.local` should look like:

```env
DATABASE_URL=postgresql://username:password@host/database
BETTER_AUTH_SECRET=your-generated-secret
BETTER_AUTH_URL=http://localhost:3000
```

To generate a secret:

```bash
openssl rand -base64 32
```

### 2. Push the database schema

Since migrations are already generated, you can push the schema to your Neon database:

```bash
npm run db:push
```

Or run migrations:

```bash
npm run db:migrate
```

### 3. Start the development server

```bash
npm run dev
```

The wiki will be available at [http://localhost:3000](http://localhost:3000)

### 4. Create your first user

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Click "Sign Up"
3. Fill in your name, email, and password
4. You'll be automatically logged in

### 5. Create your first article

1. Click "Create Article" on the home page
2. Enter a title and content (markdown supported!)
3. Click "Create Article"

## Testing

Run the Playwright tests (make sure the dev server is running):

```bash
# In one terminal
npm run dev

# In another terminal
npm test
```

## Common Issues

### Database connection fails

Make sure your Neon connection string is correct in `.env.local`. The format should be:

```
postgresql://username:password@host/database?sslmode=require
```

### Migration errors

If you get migration errors, try pushing the schema directly:

```bash
npm run db:push
```

This will sync your database schema without running migrations.

## What's Next?

- Create more articles with markdown formatting
- Invite other users to sign up
- Explore the code in the `/app`, `/components`, and `/db` directories

## Need Help?

- Check the main README.md for more details
- Look at the test files in `/tests` for usage examples
- Review the database schema in `/db/schema.ts`
