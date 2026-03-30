import twilio from 'twilio';

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch (e) {
        console.error("Failed to initialize Twilio:", e);
    }
}

export const activateEmergency = async (req, res) => {
    const userId = req.user?.id || 'Unknown';
    console.log(`\n🚨 [URGENT] EMERGENCY ACCESS ACTIVATED for User ID: ${userId} 🚨\n`);
    res.status(200).json({ message: 'Emergency alert logged on server!' });
};

export const getHospitals = async (req, res) => {
    // Generate dynamic mock data
    const mockHospitals = [
        { id: 'h1', name: 'City General Hospital', distance: '1.2', eta: Math.floor(Math.random() * 5) + 3, availableAmbulances: 2 },
        { id: 'h2', name: 'St. Mary Emergency Care', distance: '3.5', eta: Math.floor(Math.random() * 8) + 6, availableAmbulances: 1 },
        { id: 'h3', name: 'Metro Health Center', distance: '4.8', eta: Math.floor(Math.random() * 10) + 8, availableAmbulances: 4 },
        { id: 'h4', name: 'Downtown Clinic', distance: '2.1', eta: 15, availableAmbulances: 0 },
    ].sort((a, b) => a.eta - b.eta);
    
    res.status(200).json(mockHospitals);
};

export const bookAmbulance = async (req, res) => {
    const { hospitalId, hospitalName } = req.body;
    
    // If testing SMS to yourself, you would put your actual phone number in an env variable
    // Twilio trial accounts ONLY allow sending to verified numbers
    const userPhone = process.env.TWILIO_TEST_NUMBER || '+1234567890'; 
    
    console.log(`\n🚑 DISPATCHING AMBULANCE FROM: ${hospitalName} 🚑`);
    
    const smsBody = `EMERGENCY ALERT CONFIRMED: An ambulance has been dispatched from ${hospitalName} and is en route to your location.`;
    
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        try {
             await twilioClient.messages.create({
                 body: smsBody,
                 from: process.env.TWILIO_PHONE_NUMBER,
                 to: userPhone
             });
             console.log(`✅ Real SMS successfully sent via Twilio to ${userPhone}`);
        } catch (error) {
             console.error("❌ Failed to send Twilio SMS:", error);
             console.log(`\n📱 --- FALLBACK SIMULATED SMS NOTIFICATION --- 📱\nTo: ${userPhone}\nMessage: ${smsBody}\n---------------------------------------\n`);
        }
    } else {
         console.log(`\n📱 --- SIMULATED SMS NOTIFICATION --- 📱\nTo: Patient Phone\nMessage: ${smsBody}\n---------------------------------------\n`);
    }
    
    res.status(200).json({ message: 'Ambulance booked', hospitalName });
};
