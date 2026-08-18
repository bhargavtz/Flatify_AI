import { MongoClient, ServerApiVersion } from "mongodb"

let client: MongoClient
let clientPromiseInternal: Promise<MongoClient>

const getClientPromise = (): Promise<MongoClient> => {
  if (clientPromiseInternal) return clientPromiseInternal;

  if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
  }

  const uri = process.env.MONGODB_URI
  const options = {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  }

  if (process.env.NODE_ENV === "development") {
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromiseInternal = globalWithMongo._mongoClientPromise
  } else {
    client = new MongoClient(uri, options)
    clientPromiseInternal = client.connect()
  }
  return clientPromiseInternal;
}

const clientPromise = {
  then: (onfulfilled?: (value: MongoClient) => any, onrejected?: (reason: any) => any) => {
    return getClientPromise().then(onfulfilled, onrejected);
  }
} as unknown as Promise<MongoClient>;

export default clientPromise;
