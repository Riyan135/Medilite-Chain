import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@medilite.com';
  const password = 'AdminPassword123';
  const name = 'MediLite Admin';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedAdmin = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        name,
        role: 'ADMIN',
        isVerified: true,
      },
    });
    console.log('Admin user updated successfully!');
    console.log('-----------------------------------');
    console.log('  Email   :', updatedAdmin.email);
    console.log('  Password:', password);
    console.log('  Role    :', updatedAdmin.role);
    console.log('  ID      :', updatedAdmin.id);
    console.log('-----------------------------------');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log('-----------------------------------');
  console.log('  Email   :', admin.email);
  console.log('  Password:', password);
  console.log('  Role    :', admin.role);
  console.log('  ID      :', admin.id);
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
