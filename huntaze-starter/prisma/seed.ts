import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const creatorId = 'demo-creator'
  const now = new Date()

  const contents = await Promise.all(
    [
      {
        title: 'VIP Welcome Pack',
        caption: 'Bundle exclusif + message audio personnalisé',
        postedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        price: 25,
        isPaid: true,
        views: 820,
        likes: 210,
        comments: 18,
        revenue: 640,
        tips: 120,
        engagementRate: 0.24,
      },
      {
        title: 'Teaser daily routine',
        caption: 'Story 3 clips + CTA DM « VIP »',
        postedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        price: null,
        isPaid: false,
        views: 1120,
        likes: 340,
        comments: 42,
        revenue: 280,
        tips: 35,
        engagementRate: 0.31,
      },
      {
        title: 'PPV Live replay',
        caption: 'Replay avant fermeture + upsell sexting',
        postedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        price: 18,
        isPaid: true,
        views: 560,
        likes: 148,
        comments: 9,
        revenue: 410,
        tips: 78,
        engagementRate: 0.27,
      },
    ].map(async (item, index) =>
      prisma.content.create({
        data: {
          creatorId,
          creatorName: 'Demo Creator',
          type: index === 1 ? 'POST' : 'BUNDLE',
          title: item.title,
          caption: item.caption,
          postedAt: item.postedAt,
          price: item.price ?? undefined,
          isPaid: item.isPaid,
          mediaUrl: `https://demo.huntaze.ai/media/${index + 1}.jpg`,
          performances: {
            create: {
              views: item.views,
              likes: item.likes,
              comments: item.comments,
              revenue: item.revenue,
              tips: item.tips,
              engagementRate: item.engagementRate,
            },
          },
        },
        include: { performances: true },
      })
    )
  )

  await Promise.all([
    prisma.fan.upsert({
      where: { onlyfansId: 'fan_1001' },
      update: {
        lastActiveAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        lifetimeValue: 1290,
      },
      create: {
        creatorId,
        onlyfansId: 'fan_1001',
        username: 'vip_whale',
        country: 'FR',
        subscribedAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
        lastActiveAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        lifetimeValue: 1290,
      },
    }),
    prisma.fan.upsert({
      where: { onlyfansId: 'fan_1002' },
      update: {
        lastActiveAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        lifetimeValue: 250,
      },
      create: {
        creatorId,
        onlyfansId: 'fan_1002',
        username: 'ig_catcher',
        country: 'US',
        subscribedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        lastActiveAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        lifetimeValue: 250,
      },
    }),
    prisma.fan.upsert({
      where: { onlyfansId: 'fan_1003' },
      update: {
        lastActiveAt: now,
        lifetimeValue: 86,
      },
      create: {
        creatorId,
        onlyfansId: 'fan_1003',
        username: 'reddit_hunter',
        country: 'DE',
        subscribedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        lastActiveAt: now,
        lifetimeValue: 86,
      },
    }),
  ])

  await prisma.scrapeLog.upsert({
    where: { jobId: 'seed-job-1' },
    update: {
      payload: {
        posts: contents.map((content) => ({ id: content.id, title: content.title }))
      }
    },
    create: {
      jobId: 'seed-job-1',
      scrapeType: 'posts',
      creatorId,
      payload: {
        posts: contents.map((content) => ({ id: content.id, title: content.title }))
      }
    }
  })

  console.log(`Seeded ${contents.length} contents and demo fans.`)
}

main()
  .catch((error) => {
    console.error('Seed error', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
