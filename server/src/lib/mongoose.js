import dns from 'node:dns';
import mongoose from 'mongoose';



const LOOPBACK_DNS_SERVERS = new Set(['127.0.0.1', '::1']);

const configureDnsResolvers = () => {
  const envServers = process.env.DNS_SERVERS
    ?.split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (envServers?.length) {
    dns.setServers(envServers);
    return;
  }

  const activeServers = dns.getServers();
  const hasOnlyLoopbackServers =
    activeServers.length > 0 &&
    activeServers.every((server) => LOOPBACK_DNS_SERVERS.has(server));

  if (hasOnlyLoopbackServers) {
    dns.setServers(['1.1.1.1', '8.8.8.8']);

    if (process.env.LOG_LEVEL === 'debug' || process.env.LOG_LEVEL === 'verbose') {
      console.warn(
        'Loopback-only DNS detected. Falling back to public DNS resolvers for MongoDB SRV lookup.'
      );
    }
  }
};

export const connectMongo = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  configureDnsResolvers();

  const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;

  if (!mongoUri) {
    throw new Error('Mongo connection string not found. Set MONGO_URI in the server environment.');
  }

  await mongoose.connect(mongoUri, {
    dbName: mongoUri.includes('/')
      ? undefined
      : 'medilite-chain',
    family: 4,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  return mongoose.connection;
};

export default mongoose;
