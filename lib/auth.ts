// This file configures 'iron-session' for managing staff login state.
// It creates an encrypted cookie to store session data.

import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import { StaffSession } from "./types";
// Import SessionOptions type if needed for updateConfig method signature, though not strictly required for this fix
import type { SessionOptions } from "iron-session";

// Define the shape of the actual data stored IN the session
interface SessionDataBase {
  staff?: StaffSession;
}

// Define the SessionData type by providing SessionDataBase as the type argument to IronSession
// This adds the .save(), .destroy(), .updateConfig() methods to our SessionDataBase structure
export type SessionData = IronSession<SessionDataBase>;

// Configure the session
export const sessionOptions: SessionOptions = { // Added SessionOptions type for clarity
  password: process.env.AUTH_SECRET as string, // Must set in .env.local
  cookieName: "privacyclub_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production", // Use environment variable for secure flag
    httpOnly: true,
  },
};

// Helper function to get the current session from a server component or route
export async function getSession(): Promise<SessionData> { // Added Promise return type
  const session = await getIronSession<SessionDataBase>( // Pass the BASE data type here
    cookies(),
    sessionOptions
  );
  // The returned session object will automatically have the IronSession methods mixed in
  return session;
}

