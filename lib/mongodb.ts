import { MongoClient } from "mongodb";

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const mongoUri = process.env.MONGODB_URI;

let clientPromise: Promise<MongoClient>;

if (!mongoUri) {
  clientPromise = Promise.reject(new Error("Missing `MONGODB_URI` in environment."));
  clientPromise.catch(() => {});
} else {
  if (process.env.NODE_ENV === "development") {
    if (!global.__mongoClientPromise) {
      const client = new MongoClient(mongoUri);
      global.__mongoClientPromise = client.connect();
    }
    clientPromise = global.__mongoClientPromise;
  } else {
    const client = new MongoClient(mongoUri);
    clientPromise = client.connect();
  }
}

export default clientPromise;
