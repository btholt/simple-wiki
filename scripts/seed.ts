import { db } from "../db";
import { articles, user } from "../db/schema";
import { sql } from "drizzle-orm";

const topics = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "CSS",
  "HTML",
  "Web Development",
  "DevOps",
  "Git",
  "Docker",
  "Testing",
  "Performance",
  "Security",
  "API Design",
  "Database Design",
  "Frontend",
  "Backend",
  "Full Stack",
];

const contentTemplates = [
  (topic: string) => `# Introduction to ${topic}

${topic} is a powerful tool for modern web development. In this article, we'll explore the key concepts and best practices.

## Getting Started

To begin working with ${topic}, you'll need to understand the fundamentals. Here are the main points:

- Understanding the core concepts
- Setting up your development environment
- Building your first project

## Best Practices

When working with ${topic}, keep these best practices in mind:

1. Write clean, maintainable code
2. Test your implementation thoroughly
3. Follow community standards
4. Document your work

## Conclusion

${topic} is an essential part of the modern developer's toolkit. With practice and dedication, you'll master it in no time.`,

  (topic: string) => `# Advanced ${topic} Techniques

Once you've mastered the basics of ${topic}, it's time to explore advanced techniques that will take your skills to the next level.

## Advanced Patterns

Here are some advanced patterns you should know:

- **Pattern 1**: Optimizing for performance
- **Pattern 2**: Scalability considerations
- **Pattern 3**: Security best practices

## Real-World Examples

Let's look at how ${topic} is used in production environments:

### Example 1: Large-Scale Applications

In large-scale applications, ${topic} helps manage complexity and maintain code quality.

### Example 2: Performance-Critical Systems

When performance matters, ${topic} provides the tools you need to optimize your code.

## Tips and Tricks

- Always profile before optimizing
- Use the right tool for the job
- Stay up to date with latest releases

## Further Reading

Continue your ${topic} journey by exploring the official documentation and community resources.`,

  (topic: string) => `# ${topic} Tutorial: A Comprehensive Guide

Welcome to this comprehensive guide on ${topic}! Whether you're a beginner or looking to refresh your knowledge, this tutorial has you covered.

## What is ${topic}?

${topic} is a technology that enables developers to build efficient and scalable applications.

## Prerequisites

Before starting, make sure you have:

- Basic programming knowledge
- A code editor
- An understanding of web fundamentals

## Step-by-Step Guide

### Step 1: Installation

First, you'll need to install the necessary tools and dependencies.

### Step 2: Configuration

Next, configure your project to work with ${topic}.

### Step 3: Implementation

Now you're ready to start implementing your solution using ${topic}.

## Common Pitfalls

Avoid these common mistakes:

- Not reading the documentation
- Ignoring error messages
- Over-engineering solutions

## Next Steps

Now that you understand ${topic}, try building a project to solidify your knowledge!`,
];

async function seed() {
  console.log("🌱 Starting seed...");

  // Create a test user
  console.log("Creating test user...");
  const existingUsers = await db.execute(
    sql`SELECT * FROM "user" WHERE email = 'seed@example.com'`
  );

  let userId: string;

  if (existingUsers.rows.length > 0) {
    userId = existingUsers.rows[0].id as string;
    console.log("✓ Test user already exists");
  } else {
    // Create test user with BetterAuth-compatible fields
    const result = await db.execute(
      sql`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") 
          VALUES (
            gen_random_uuid()::text,
            'Seed User',
            'seed@example.com',
            false,
            NOW(),
            NOW()
          ) 
          RETURNING id`
    );
    userId = result.rows[0].id as string;
    console.log("✓ Test user created");
  }

  // Check existing article count
  const existingCount = await db.execute(
    sql`SELECT COUNT(*) as count FROM articles WHERE author_id = ${userId}`
  );
  const currentCount = Number(existingCount.rows[0].count) || 0;

  if (currentCount >= 100) {
    console.log(`✓ Already have ${currentCount} articles, skipping seed`);
    return;
  }

  const articlesToCreate = 100 - currentCount;
  console.log(`Creating ${articlesToCreate} articles...`);

  // Create 100 articles
  for (let i = 0; i < articlesToCreate; i++) {
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const template =
      contentTemplates[Math.floor(Math.random() * contentTemplates.length)];
    const variation = Math.random() > 0.5 ? "Guide" : "Tips";
    const title = `${topic} ${variation} #${currentCount + i + 1}`;
    const content = template(topic);

    // Random creation date within the last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    await db.execute(
      sql`INSERT INTO articles (title, content, author_id, created_at, updated_at) 
          VALUES (
            ${title},
            ${content},
            ${userId},
            ${createdAt.toISOString()},
            ${createdAt.toISOString()}
          )`
    );

    if ((i + 1) % 10 === 0) {
      console.log(`  Created ${i + 1}/${articlesToCreate} articles...`);
    }
  }

  console.log(`✓ Created ${articlesToCreate} articles`);
  console.log("🎉 Seed completed!");
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
