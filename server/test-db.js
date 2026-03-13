import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://admin:admin@127.0.0.1:5432/fixxr"
});

async function test() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully!");
    const res = await client.query('SELECT NOW()');
    console.log("Result:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
}

test();
