import { PrismaClient } from '@prisma/client';

// Singleton Prisma client (reused across warm Lambda invocations)
let prisma: PrismaClient | null = null;

function getPrismaClient() {
  if (!prisma) {
    // Use Accelerate URL if available, otherwise direct connection
    const connectionUrl = process.env.ACCELERATE_URL || process.env.DATABASE_URL;
    const useAccelerate = !!process.env.ACCELERATE_URL;
    
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
      datasources: {
        db: {
          url: connectionUrl
        }
      },
      errorFormat: 'minimal'
    });
    
    console.log('[PRISMA] Client initialized', { 
      accelerate: useAccelerate,
      env: process.env.NODE_ENV 
    });
  }
  return prisma;
}

export async function handler(event: any) {
  const userId = event.pathParameters?.userId || event.userId || 'user-1';
  const startTime = Date.now();
  
  console.log('[PRISMA-REQUEST]', { userId });

  try {
    const client = getPrismaClient();
    
    // Test connection
    await client.$queryRaw`SELECT 1`;
    
    const user = await client.user.findUnique({
      where: { 
        id: userId,
        deletedAt: null 
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscription: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const duration = Date.now() - startTime;

    if (!user) {
      console.log('[PRISMA-NOT-FOUND]', { userId, duration });
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    console.log('[PRISMA-SUCCESS]', { userId, duration });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[PRISMA-ERROR]', { 
      userId,
      error: error.message,
      code: error.code,
      duration 
    });

    // Map Prisma errors to HTTP status codes
    let statusCode = 500;
    let message = 'Internal server error';

    if (error.code === 'P2002') {
      statusCode = 409;
      message = 'Unique constraint violation';
    } else if (error.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    } else if (error.code === 'P2003') {
      statusCode = 400;
      message = 'Foreign key constraint violation';
    } else if (error.message?.includes('connect')) {
      statusCode = 503;
      message = 'Database unavailable';
    }

    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: message }),
    };
  }
}

// Cleanup on Lambda shutdown
process.on('beforeExit', async () => {
  if (prisma) {
    await prisma.$disconnect();
    console.log('[PRISMA] Client disconnected');
  }
});
