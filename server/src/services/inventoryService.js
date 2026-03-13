import cron from 'node-cron';
import pkg from '@prisma/client';
import twilio from 'twilio';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

let twilioClient;
if (process.env.TWILIO_SID && process.env.TWILIO_SID.startsWith('AC')) {
  twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
}

export const startInventoryService = () => {
  console.log('Starting Medicine Inventory Alert Service...');
  
  // Run every hour to check for low stock
  cron.schedule('0 * * * *', async () => {
    try {
      const lowStockItems = await prisma.medicineInventory.findMany({
        where: {
          stock: {
            lte: prisma.medicineInventory.minThreshold
          }
        },
        include: {
          patient: {
            include: { user: true }
          }
        }
      });

      // Filter manually because Prisma doesn't support comparing two columns in where clause easily for some versions without raw SQL
      const filteredLowStock = (await prisma.medicineInventory.findMany({
          include: {
              patient: {
                  include: { user: true }
              }
          }
      })).filter(item => item.stock <= item.minThreshold);

      for (const item of filteredLowStock) {
        console.log(`[LOW STOCK] ${item.name} for ${item.patient.user.name}`);
        
        if (item.patient.user.phone && twilioClient) {
          try {
            await twilioClient.messages.create({
              body: `Hi ${item.patient.user.name}, your ${item.name} stock is low (${item.stock} left). Please refill soon! - MediLite`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: item.patient.user.phone
            });
          } catch (twilioError) {
            console.error('Twilio Error:', twilioError.message);
          }
        }
      }
    } catch (error) {
      console.error('Error in inventory alert cron job:', error);
    }
  });
};
