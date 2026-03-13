import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

export const getSystemStats = async (req, res) => {
  try {
    const [totalUsers, totalRecords, pendingDoctors, recentLogs] = await Promise.all([
      prisma.user.count(),
      prisma.medicalRecord.count(),
      prisma.user.count({ where: { role: 'DOCTOR', isVerified: false } }),
      prisma.medicalRecord.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { patient: { include: { user: { select: { name: true } } } } }
      })
    ]);

    res.status(200).json({
      totalUsers,
      totalRecords,
      pendingDoctors,
      activeSessions: Math.floor(totalUsers * 0.4),
      recentLogs: recentLogs.map(log => ({
        id: log.id,
        message: `New medical record uploaded for ${log.patient.user.name}`,
        time: log.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id }
    });

    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const approveDoctor = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role: 'DOCTOR', isVerified: true }
    });

    res.status(200).json(user);
  } catch (error) {
    console.error('Error approving doctor:', error);
    res.status(500).json({ error: 'Failed to approve doctor' });
  }
};
