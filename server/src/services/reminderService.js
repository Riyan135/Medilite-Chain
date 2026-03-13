import cron from 'node-cron';
import pkg from '@prisma/client';
import twilio from 'twilio';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

let twilioClient;
if (process.env.TWILIO_SID && process.env.TWILIO_SID.startsWith('AC')) {
  twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
} else {
  console.warn('Twilio credentials missing or invalid. SMS reminders will be disabled.');
}

// This cron job runs every minute to check for reminders
export const startReminderService = () => {
  console.log('Starting Medicine Reminder Service...');
  
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    try {
      const reminders = await prisma.medicineReminder.findMany({
        where: {
          isActive: true,
          time: currentTime
        },
        include: {
          patient: {
            include: { user: true }
          }
        }
      });

      for (const reminder of reminders) {
        console.log(`[ALARM] Sending reminder to ${reminder.patient.user.name} for ${reminder.medicineName}`);
        
        // Automated Inventory Depletion Logic
        try {
          // Find matching medicine in inventory (case-insensitive search)
          const inventoryItem = await prisma.medicineInventory.findFirst({
            where: {
              patientId: reminder.patientId,
              name: {
                equals: reminder.medicineName,
                mode: 'insensitive'
              }
            }
          });

          if (inventoryItem) {
            // Extract numeric dosage (e.g. "1 tablet" -> 1, "2" -> 2)
            const dosageMatch = reminder.dosage.match(/(\d+(\.\d+)?)/);
            const amountToSubtract = dosageMatch ? parseFloat(dosageMatch[0]) : 1;
            
            if (inventoryItem.stock >= amountToSubtract) {
              await prisma.medicineInventory.update({
                where: { id: inventoryItem.id },
                data: {
                  stock: {
                    decrement: amountToSubtract
                  }
                }
              });
              console.log(`[INVENTORY] Auto-decreased ${reminder.medicineName} stock by ${amountToSubtract}. New stock: ${inventoryItem.stock - amountToSubtract}`);
            } else {
              console.log(`[INVENTORY] Insufficient stock for ${reminder.medicineName}. Current: ${inventoryItem.stock}, Needed: ${amountToSubtract}`);
            }
          }
        } catch (depletionError) {
          console.error('[INVENTORY] Depletion error:', depletionError.message);
        }

        if (reminder.patient.user.phone && twilioClient) {
          try {
            await twilioClient.messages.create({
              body: `Hi ${reminder.patient.user.name}, it's time for your ${reminder.medicineName} (${reminder.dosage}). Keep healthy! - MediLite`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: reminder.patient.user.phone
            });
          } catch (twilioError) {
            console.error('Twilio Error:', twilioError.message);
          }
        } else if (!twilioClient && reminder.patient.user.phone) {
          console.log(`[SMS DISABLED] Would have sent reminder to ${reminder.patient.user.name}`);
        }
      }
    } catch (error) {
      console.error('Error in reminder cron job:', error);
    }
  });
};
