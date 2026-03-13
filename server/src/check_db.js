import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const users = await prisma.user.findMany({
      include: { patientProfile: true }
    });
    console.log('--- Current Users in Database ---');
    users.forEach(u => {
      console.log(`User: ${u.name} (${u.email}) - Role: ${u.role}`);
      console.log(`Clerk ID: ${u.clerkId}`);
      console.log(`Has Patient Profile: ${!!u.patientProfile}`);
      console.log('---------------------------------');
    });
  } catch (err) {
    console.error('Error checking DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
