import dotenv from "dotenv";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const DB_NAME = process.env.MONGO_DB_NAME || "visitor_pass_management";

let mongoClient = null;
let database = null;

export async function connectDatabase() {
  if (database) {
    return database;
  }

  const mongoUri = String(process.env.MONGO_URI || "").trim();

  console.log("[MongoDB] MONGO_URI loaded:", mongoUri ? "YES" : "NO");

  if (!mongoUri) {
    throw new Error(
      "MONGO_URI is missing. Check the .env file in the project root.",
    );
  }

  try {
    mongoClient = new MongoClient(mongoUri);

    await mongoClient.connect();

    database = mongoClient.db(DB_NAME);

    await database.command({
      ping: 1,
    });

    console.log(`[MongoDB] Connected successfully to database: ${DB_NAME}`);

    return database;
  } catch (error) {
    console.error("[MongoDB] Connection failed:", error);

    throw error;
  }
}

function getDatabase() {
  if (!database) {
    throw new Error("MongoDB is not connected. Call connectDatabase() first.");
  }

  return database;
}

function getCollection(name) {
  return getDatabase().collection(name);
}

function convertObjectId(value) {
  if (!value) {
    return value;
  }

  if (value instanceof ObjectId) {
    return value;
  }

  if (
    typeof value === "string" &&
    ObjectId.isValid(value) &&
    String(new ObjectId(value)) === value
  ) {
    return new ObjectId(value);
  }

  return value;
}

function normalizeDocument(document) {
  if (!document) {
    return null;
  }

  const normalized = {
    ...document,
  };

  if (document._id) {
    normalized._id = String(document._id);
  }

  if (!normalized.id && normalized._id) {
    normalized.id = normalized._id;
  }

  if (normalized.id) {
    normalized.id = String(normalized.id);
  }

  return normalized;
}

function normalizeDocuments(documents) {
  return documents.map(normalizeDocument);
}

function normalizeQuery(query) {
  if (!query) {
    return {};
  }

  if (typeof query === "function") {
    return query;
  }

  const normalized = {};

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }

    if (key === "_id") {
      normalized._id = convertObjectId(value);
      continue;
    }

    normalized[key] = value;
  }

  return normalized;
}

function createCollection(collectionName) {
  const collection = () => getCollection(collectionName);

  return {
    async find(query = {}) {
      const mongoQuery = normalizeQuery(query);

      if (typeof mongoQuery === "function") {
        const documents = await collection().find({}).toArray();

        const normalized = normalizeDocuments(documents);

        return normalized.filter(mongoQuery);
      }

      const documents = await collection().find(mongoQuery).toArray();

      return normalizeDocuments(documents);
    },

    async findOne(query = {}) {
      const mongoQuery = normalizeQuery(query);

      if (typeof mongoQuery === "function") {
        const documents = await collection().find({}).toArray();

        const normalized = normalizeDocuments(documents);

        return normalized.find(mongoQuery) || null;
      }

      const document = await collection().findOne(mongoQuery);

      return normalizeDocument(document);
    },

    async insertOne(document) {
      const newDocument = {
        ...document,
      };

      if (!newDocument.id && !newDocument._id) {
        newDocument.id =
          "doc_" +
          Date.now().toString(36) +
          "_" +
          Math.random().toString(36).substring(2, 8);
      }

      if (newDocument._id && typeof newDocument._id === "string") {
        newDocument._id = convertObjectId(newDocument._id);
      }

      const result = await collection().insertOne(newDocument);

      const inserted = await collection().findOne({
        _id: result.insertedId,
      });

      return normalizeDocument(inserted);
    },

    async insertMany(documents) {
      const prepared = documents.map((document) => {
        const item = {
          ...document,
        };

        if (!item.id && !item._id) {
          item.id =
            "doc_" +
            Date.now().toString(36) +
            "_" +
            Math.random().toString(36).substring(2, 8);
        }

        return item;
      });

      if (prepared.length === 0) {
        return [];
      }

      const result = await collection().insertMany(prepared);

      const insertedDocuments = [];

      for (const insertedId of Object.values(result.insertedIds)) {
        const document = await collection().findOne({
          _id: insertedId,
        });

        if (document) {
          insertedDocuments.push(normalizeDocument(document));
        }
      }

      return insertedDocuments;
    },

    async updateOne(query, update) {
      const mongoQuery = normalizeQuery(query);

      const payload = update?.$set || update || {};

      const result = await collection().updateOne(mongoQuery, {
        $set: payload,
      });

      return {
        matchedCount: result.matchedCount,

        modifiedCount: result.modifiedCount,

        acknowledged: result.acknowledged,
      };
    },

    async deleteOne(query) {
      const mongoQuery = normalizeQuery(query);

      const result = await collection().deleteOne(mongoQuery);

      return {
        deletedCount: result.deletedCount,
      };
    },

    async countDocuments(query = {}) {
      const mongoQuery = normalizeQuery(query);

      return collection().countDocuments(mongoQuery);
    },
  };
}

export const Collections = {
  users: createCollection("users"),

  organizations: createCollection("organizations"),

  visitors: createCollection("visitors"),

  appointments: createCollection("appointments"),

  passes: createCollection("passes"),

  checkLogs: createCollection("checkLogs"),

  notifications: createCollection("notifications"),

  otps: createCollection("otps"),
};

export async function seedDatabase() {
  try {
    const db = getDatabase();

    console.log("[MongoDB] Checking demo data...");

    const organizationId = "org_apex";

    const existingOrganization = await db
      .collection("organizations")
      .findOne({ id: organizationId });

    if (!existingOrganization) {
      await db.collection("organizations").insertOne({
        id: organizationId,
        name: "Apex Corporation",
        code: "APEX",
        address: "Bhopal, Madhya Pradesh, India",
        phone: "+91 9876543210",
        email: "admin@apexcorp.com",
        settings: {
          requireApproval: true,
          requirePhoto: true,
          enableEmail: true,
          enableSms: true,
        },
        createdAt: new Date().toISOString(),
      });

      console.log("[MongoDB] Demo organization created.");
    }

    const demoUsers = [
      {
        id: "usr_admin_demo",
        name: "Alex Morgan",
        email: "admin@apexcorp.com",
        role: "admin",
        department: "Administration",
        phone: "+919800000001",
      },
      {
        id: "usr_security_demo",
        name: "James Wilson",
        email: "security@apexcorp.com",
        role: "security",
        department: "Security",
        phone: "+919800000002",
      },
      {
        id: "usr_host_demo",
        name: "Elena Rostova",
        email: "elena.rostova@apexcorp.com",
        role: "host",
        department: "Human Resources",
        phone: "+919800000003",
      },
      {
        id: "usr_visitor_demo",
        name: "Alex Rivera",
        email: "alex.rivera@fintech.io",
        role: "visitor",
        department: "Visitor",
        phone: "+919800000004",
      },
    ];

    const passwordHash = await bcrypt.hash("pass123", 10);

    for (const demoUser of demoUsers) {
      const existingUser = await db
        .collection("users")
        .findOne({ email: demoUser.email });

      if (!existingUser) {
        await db.collection("users").insertOne({
          ...demoUser,
          passwordHash,
          organizationId,
          avatar: "",
          createdAt: new Date().toISOString(),
        });

        console.log(
          `[MongoDB] Demo ${demoUser.role} created: ${demoUser.email}`,
        );
      } else {
        console.log(
          `[MongoDB] Demo ${demoUser.role} already exists: ${demoUser.email}`,
        );
      }
    }

    const existingVisitor = await db.collection("visitors").findOne({
      email: "alex.rivera@fintech.io",
    });

    if (!existingVisitor) {
      await db.collection("visitors").insertOne({
        id: "vis_demo_alex",
        fullName: "Alex Rivera",
        name: "Alex Rivera",
        email: "alex.rivera@fintech.io",
        phone: "+919800000004",
        company: "FinTech.io",
        idProofType: "National ID",
        idProofNumber: "DEMO-123456",
        photoUrl: "",
        organizationId,
        createdAt: new Date().toISOString(),
      });

      console.log("[MongoDB] Demo visitor record created.");
    }

    console.log("[MongoDB] Demo data is ready.");
  } catch (error) {
    console.error("[MongoDB] Seed error:", error);
    throw error;
  }
}

export async function generateQrCodeDataUrl(data) {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 280,

      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("[QR] Generation error:", error);

    return "";
  }
}

export async function closeDatabase() {
  if (mongoClient) {
    await mongoClient.close();

    mongoClient = null;
    database = null;

    console.log("[MongoDB] Connection closed.");
  }
}

process.on("SIGINT", async () => {
  await closeDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeDatabase();
  process.exit(0);
});
