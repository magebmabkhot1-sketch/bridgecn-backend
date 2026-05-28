import { PrismaClient, StudentType, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const universities = [
    {
      slug: 'zhejiang-university',
      name: 'Zhejiang University',
      city: 'Hangzhou',
      logoUrl: 'https://placehold.co/120x120?text=ZJU',
      description: 'A top university with a vibrant international student body and strong innovation culture.',
      studentsCount: 12800,
      activeUsers: 7600,
      eventsThisMonth: 18
    },
    {
      slug: 'tsinghua-university',
      name: 'Tsinghua University',
      city: 'Beijing',
      logoUrl: 'https://placehold.co/120x120?text=THU',
      description: 'A leading research university connecting ambitious students from around the world.',
      studentsCount: 15400,
      activeUsers: 9100,
      eventsThisMonth: 24
    },
    {
      slug: 'fudan-university',
      name: 'Fudan University',
      city: 'Shanghai',
      logoUrl: 'https://placehold.co/120x120?text=FDU',
      description: 'A global campus in Shanghai where cultures, ideas, and languages meet.',
      studentsCount: 13900,
      activeUsers: 8800,
      eventsThisMonth: 20
    }
  ];

  for (const university of universities) {
    await prisma.university.upsert({
      where: { slug: university.slug },
      update: university,
      create: university
    });
  }

  const demoPassword = await bcrypt.hash('Password123!', 10);
  const zju = await prisma.university.findUnique({ where: { slug: 'zhejiang-university' } });
  const thu = await prisma.university.findUnique({ where: { slug: 'tsinghua-university' } });
  const fdu = await prisma.university.findUnique({ where: { slug: 'fudan-university' } });

  const demoUsers = [
    {
      email: 'demo@bridgecn.com',
      fullName: 'BridgeCN Demo',
      universityId: zju?.id,
      studentType: StudentType.INTERNATIONAL,
      yearOfStudy: 'Junior',
      interestsJson: ['AI', 'Startups', 'Language Exchange'],
      bio: 'A demo profile to help you test the platform.',
      avatarUrl: 'https://placehold.co/200x200?text=BD',
      language: 'en',
      isVerified: true,
      role: UserRole.ADMIN,
      profileCompletion: 90
    },
    {
      email: 'li.mei@bridgecn.com',
      fullName: 'Li Mei',
      universityId: zju?.id,
      studentType: StudentType.CHINESE,
      yearOfStudy: 'Senior',
      interestsJson: ['Photography', 'Design', 'Travel'],
      bio: 'Passionate about campus culture and helping international friends settle in.',
      avatarUrl: 'https://placehold.co/200x200?text=LM',
      language: 'zh',
      isVerified: true,
      role: UserRole.USER,
      profileCompletion: 82
    },
    {
      email: 'alex.chen@bridgecn.com',
      fullName: 'Alex Chen',
      universityId: thu?.id,
      studentType: StudentType.INTERNATIONAL,
      yearOfStudy: 'Graduate',
      interestsJson: ['Machine Learning', 'Football', 'Coffee'],
      bio: 'Research student building bridges between cultures through shared projects.',
      avatarUrl: 'https://placehold.co/200x200?text=AC',
      language: 'en',
      isVerified: true,
      role: UserRole.USER,
      profileCompletion: 76
    },
    {
      email: 'sara.wang@bridgecn.com',
      fullName: 'Sara Wang',
      universityId: fdu?.id,
      studentType: StudentType.CHINESE,
      yearOfStudy: 'Sophomore',
      interestsJson: ['Music', 'Events', 'Volunteering'],
      bio: 'Organizer of student mixers and campus exchange events.',
      avatarUrl: 'https://placehold.co/200x200?text=SW',
      language: 'en',
      isVerified: true,
      role: UserRole.ORGANIZER,
      profileCompletion: 88
    }
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        ...user,
        passwordHash: demoPassword
      },
      create: {
        ...user,
        passwordHash: demoPassword
      }
    });
  }

  const allUsers = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  const allUniversities = await prisma.university.findMany();

  const organizer = allUsers.find((u) => u.email === 'sara.wang@bridgecn.com');
  const demo = allUsers.find((u) => u.email === 'demo@bridgecn.com');

  const events = [
    {
      title: 'International Welcome Mixer',
      description: 'Meet new friends, practice languages, and discover campus groups.',
      dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      location: 'Zhejiang University Main Hall',
      universityId: allUniversities[0]?.id,
      organizerId: organizer?.id
    },
    {
      title: 'Startup Lunch Talk',
      description: 'Students share ideas on building cross-border student ventures.',
      dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6),
      location: 'Tsinghua Innovation Center',
      universityId: allUniversities[1]?.id,
      organizerId: organizer?.id
    },
    {
      title: 'Language Exchange Night',
      description: 'Casual speaking circles for Mandarin, English, and more.',
      dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9),
      location: 'Fudan Student Center',
      universityId: allUniversities[2]?.id,
      organizerId: organizer?.id
    }
  ];

  for (const event of events) {
    await prisma.event.create({ data: event });
  }

  const posts = [
    {
      content: 'Just joined BridgeCN and already found three students interested in the same robotics club!',
      tagsJson: ['Robotics', 'Networking', 'Campus Life'],
      authorId: demo?.id
    },
    {
      content: 'Looking for a language partner for weekly coffee chats around campus.',
      tagsJson: ['Language Exchange', 'Coffee', 'Friends'],
      authorId: allUsers[1]?.id
    },
    {
      content: 'Our event had students from 12 countries last week — this is the energy we need.',
      tagsJson: ['Events', 'Community', 'International'],
      authorId: allUsers[3]?.id
    }
  ];

  for (const post of posts) {
    await prisma.post.create({ data: post });
  }

  const alice = allUsers[0];
  const bob = allUsers[1];
  if (alice && bob) {
    const [a, b] = [alice.id, bob.id].sort();
    const conversation = await prisma.conversation.upsert({
      where: {
        participantAId_participantBId: {
          participantAId: a,
          participantBId: b
        }
      },
      update: {},
      create: {
        participantAId: a,
        participantBId: b
      }
    });

    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          senderId: alice.id,
          content: 'Hey! Are you going to the welcome mixer this weekend?'
        },
        {
          conversationId: conversation.id,
          senderId: bob.id,
          content: 'Yes — I am bringing two friends from my program.'
        }
      ],
      skipDuplicates: true
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
