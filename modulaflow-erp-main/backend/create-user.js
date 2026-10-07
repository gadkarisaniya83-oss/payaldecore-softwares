require('dotenv').config();

const {
  PrismaClient
} = require('@prisma/client');

const bcrypt =
  require('bcryptjs');

const prisma =
  new PrismaClient();

async function main() {

  const password =
    'demo1234';

  const hashedPassword =
    await bcrypt.hash(password, 10);

  const user =
    await prisma.user.upsert({

      where: {
        email: 'teacher@sunrise.edu'
      },

      update: {
        password: hashedPassword,
        name: 'Teacher',
        role: 'TEACHER'
      },

      create: {
        email: 'teacher@sunrise.edu',
        password: hashedPassword,
        name: 'Teacher',
        role: 'TEACHER'
      }

    });

  console.log(
    'User created:',
    user.email
  );
}

main()
  .catch(console.error)
  .finally(() =>
    prisma.$disconnect()
  );