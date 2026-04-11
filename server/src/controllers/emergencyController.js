import User from '../models/User.js';
import { sendEmergencyBookingEmail } from '../services/mailer.js';

const buildMockHospitals = () =>
  [
    {
      id: 'h1',
      name: 'City General Hospital',
      distance: '1.2',
      eta: Math.floor(Math.random() * 5) + 3,
      availableAmbulances: 2,
      ambulanceStatus: 'AVAILABLE',
      source: 'MOCK',
    },
    {
      id: 'h2',
      name: 'St. Mary Emergency Care',
      distance: '3.5',
      eta: Math.floor(Math.random() * 8) + 6,
      availableAmbulances: 1,
      ambulanceStatus: 'AVAILABLE',
      source: 'MOCK',
    },
    {
      id: 'h3',
      name: 'Metro Health Center',
      distance: '4.8',
      eta: Math.floor(Math.random() * 10) + 8,
      availableAmbulances: 4,
      ambulanceStatus: 'AVAILABLE',
      source: 'MOCK',
    },
    {
      id: 'h4',
      name: 'Downtown Clinic',
      distance: '2.1',
      eta: 15,
      availableAmbulances: 0,
      ambulanceStatus: 'UNAVAILABLE',
      source: 'MOCK',
    },
  ].sort((a, b) => a.eta - b.eta);

const fetchLiveHospitals = async ({ latitude, longitude }) => {
  if (!process.env.GOOGLE_PLACES_API_KEY || !latitude || !longitude) {
    return null;
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.googleMapsUri',
      },
      body: JSON.stringify({
        includedTypes: ['hospital'],
        maxResultCount: 6,
        locationRestriction: {
          circle: {
            center: {
              latitude: Number(latitude),
              longitude: Number(longitude),
            },
            radius: 8000,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Places API failed with ${response.status}`);
    }

    const data = await response.json();

    return (data.places || []).map((place, index) => ({
      id: place.id,
      name: place.displayName?.text || `Hospital ${index + 1}`,
      distance: 'Live',
      eta: 5 + index * 3,
      availableAmbulances: null,
      ambulanceStatus: 'UNKNOWN',
      address: place.formattedAddress || 'Address unavailable',
      mapsUrl: place.googleMapsUri || null,
      source: 'LIVE',
    }));
  } catch (error) {
    console.error('Failed to fetch live hospitals:', error);
    return null;
  }
};

export const activateEmergency = async (req, res) => {
  const userId = req.user?.id || 'Unknown';
  console.log(`[URGENT] Emergency access activated for user ${userId}`);
  res.status(200).json({ message: 'Emergency alert logged on server' });
};

export const getHospitals = async (req, res) => {
  const liveHospitals = await fetchLiveHospitals({
    latitude: req.query.lat,
    longitude: req.query.lng,
  });

  res.status(200).json(liveHospitals || buildMockHospitals());
};

export const bookAmbulance = async (req, res) => {
  const { hospitalName } = req.body;
  const userId = req.user?.id;
  const user = userId ? await User.findById(userId).lean() : null;
  const userEmail = user?.email?.trim();

  if (!userEmail) {
    return res.status(400).json({
      error: 'No email is saved for this account. Please update your profile first.',
    });
  }

  try {
    await sendEmergencyBookingEmail({
      to: userEmail,
      name: user?.name || 'Patient',
      hospitalName,
    });

    res.status(200).json({
      message: 'Ambulance booked',
      hospitalName,
      email: {
        delivered: true,
        mode: 'smtp-email',
      },
    });
  } catch (error) {
    console.error('Failed to send ambulance email notification:', error);
    res.status(500).json({ error: 'Ambulance booked, but email notification failed' });
  }
};
