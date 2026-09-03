// Låtsas-API. Samma exporter och samma fel som den riktiga backenden,
// fast med data i minnet istället för nätverksanrop.
// Onsdag: byt sista raden i api.ts från './api.mock' till './api.real'.

import { ApiError } from "./api.types";
import type {
  AddFriendResponse,
  ApiFriend,
  AuthResponse,
  UserSearchResult,
} from "./api.types";

// --- Minne (nollställs vid app-omstart, ok enligt PM) ---

let accessToken: string | null = null;
let currentUsername: string | null = null; // härleds ur token / sätts vid login/register

// "Finns på servern". taken -> register ger 409. boom hanteras separat (500).
const knownUsers = new Set([
  "anna",
  "moises",
  "kalle",
  "lisa",
  "sofia",
  "omar",
  "tara",
  "viktor",
  "nora",
  "taken",
]);

// Vänskap som riktad graf: en kant = "adder har lagt till added".
// mutual = båda kanterna finns. status 'pending' = bara din kant finns än.
type FriendEdge = { adder: string; added: string; created_at: string };

let friendEdges: FriendEdge[] = [
  { adder: "anna", added: "moises", created_at: "2026-07-01T09:00:00.000Z" },
  { adder: "anna", added: "kalle", created_at: "2026-07-03T12:00:00.000Z" },
  { adder: "anna", added: "lisa", created_at: "2026-07-10T18:30:00.000Z" },
  { adder: "anna", added: "sofia", created_at: "2026-08-01T08:15:00.000Z" },

  { adder: "moises", added: "anna", created_at: "2026-07-02T10:00:00.000Z" },
  { adder: "moises", added: "kalle", created_at: "2026-07-05T14:00:00.000Z" },
  { adder: "moises", added: "lisa", created_at: "2026-07-12T20:00:00.000Z" },
  { adder: "moises", added: "sofia", created_at: "2026-08-02T09:00:00.000Z" },
  { adder: "moises", added: "omar", created_at: "2026-08-20T16:45:00.000Z" },
  { adder: "moises", added: "tara", created_at: "2026-08-25T11:30:00.000Z" },

  { adder: "kalle", added: "anna", created_at: "2026-07-04T09:30:00.000Z" },
  { adder: "kalle", added: "moises", created_at: "2026-07-06T13:00:00.000Z" },

  { adder: "lisa", added: "anna", created_at: "2026-07-11T19:00:00.000Z" },
  { adder: "lisa", added: "moises", created_at: "2026-07-13T21:00:00.000Z" },

  { adder: "sofia", added: "moises", created_at: "2026-08-03T10:00:00.000Z" },

  { adder: "tara", added: "moises", created_at: "2026-08-26T12:00:00.000Z" },

  // Inkommande vänförfrågningar (de har lagt till, men inte tillbakalagts än).
  { adder: "viktor", added: "moises", created_at: "2026-08-28T09:00:00.000Z" },
  { adder: "nora", added: "moises", created_at: "2026-08-29T15:00:00.000Z" },
  { adder: "viktor", added: "anna", created_at: "2026-08-28T09:30:00.000Z" },
  { adder: "nora", added: "anna", created_at: "2026-08-29T16:00:00.000Z" },
];

// --- Hjälpare ---

const delay = () =>
  new Promise((r) => setTimeout(r, 300 + Math.random() * 500)); // 300–800 ms

function requireAuth(): void {
  if (!accessToken) throw new ApiError(401, "You are not authorized");
}

// Kastar om ingen är inloggad, annars ger den inloggades användarnamn.
function requireUsername(): string {
  requireAuth();
  if (!currentUsername) throw new ApiError(401, "You are not authorized");
  return currentUsername;
}

function makeAuthResponse(username: string): AuthResponse {
  return {
    tokens: {
      access_token: `mock-access-${username}`,
      refresh_token: `mock-refresh-${username}`,
    },
    user: { username, created_at: new Date().toISOString() },
  };
}

// Har `adder` lagt till `added`?
function hasEdge(adder: string, added: string): boolean {
  return friendEdges.some((e) => e.adder === adder && e.added === added);
}

// --- Bindande exporter ---

// Anropas efter login/register, vid uppstart (från SecureStore) och med null vid utloggning.
// Mock-token har formen `mock-access-<username>`, så vi kan härleda vem som är inloggad
// även när appen startats om och bara token finns kvar.
export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token === null) {
    currentUsername = null;
  } else if (token.startsWith("mock-access-")) {
    currentUsername = token.slice("mock-access-".length);
  }
}

export async function register(
  username: string,
  password: string,
): Promise<AuthResponse> {
  await delay();
  void password;
  if (username === "boom") throw new ApiError(500, "Unknown error");
  if (knownUsers.has(username)) throw new ApiError(409, "User already exists");
  knownUsers.add(username);
  currentUsername = username;
  return makeAuthResponse(username);
}

export async function login(
  username: string,
  password: string,
): Promise<AuthResponse> {
  await delay();
  if (!knownUsers.has(username)) throw new ApiError(404, "User not found");
  if (password === "wrong") throw new ApiError(401, "Invalid password!");
  currentUsername = username;
  return makeAuthResponse(username);
}

export async function getFriends(): Promise<ApiFriend[]> {
  await delay();
  const me = requireUsername();
  // Mina vänner = alla jag har lagt till. mutual = de har lagt till mig tillbaka.
  return friendEdges
    .filter((e) => e.adder === me)
    .map((e) => ({
      username: e.added,
      created_at: e.created_at,
      mutual: hasEdge(e.added, me),
    }));
}

export async function addFriend(
  friendUsername: string,
): Promise<AddFriendResponse> {
  await delay();
  const me = requireUsername();
  if (friendUsername === me) {
    throw new ApiError(400, "You can't add yourself as a friend");
  }
  if (!knownUsers.has(friendUsername)) {
    throw new ApiError(404, "User not found");
  }
  if (!hasEdge(me, friendUsername)) {
    friendEdges.push({
      adder: me,
      added: friendUsername,
      created_at: new Date().toISOString(),
    });
  }
  // Direkt 'friends' om personen redan lagt till mig, annars 'pending'.
  const mutual = hasEdge(friendUsername, me);
  return { status: mutual ? "friends" : "pending" };
}

export async function deleteFriend(username: string): Promise<void> {
  await delay();
  const me = requireUsername();
  // Bara min egen kant tas bort. Alltid "204", även om vännen inte fanns.
  friendEdges = friendEdges.filter(
    (e) => !(e.adder === me && e.added === username),
  );
}

// --- AddFriend-vyn (mock-only, finns inte i backend-kontraktet, se api.types.ts) ---

// Användare som lagt till mig men som jag inte lagt till tillbaka.
export async function getFriendRequests(): Promise<string[]> {
  await delay();
  const me = requireUsername();
  return friendEdges
    .filter((e) => e.added === me && !hasEdge(me, e.adder))
    .map((e) => e.adder);
}

// Sök bland kända användare. Exkluderar mig själv, ömsesidiga vänner och
// inkommande förfrågningar (de visas i sin egen sektion).
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  await delay();
  const me = requireUsername();
  const q = query.trim().toLowerCase();
  if (q === "") return [];

  const incoming = new Set(
    friendEdges
      .filter((e) => e.added === me && !hasEdge(me, e.adder))
      .map((e) => e.adder),
  );

  return [...knownUsers]
    .filter((username) => {
      if (username === me) return false;
      if (!username.toLowerCase().includes(q)) return false;
      if (hasEdge(me, username) && hasEdge(username, me)) return false; // redan vänner
      if (incoming.has(username)) return false;
      return true;
    })
    .map((username) => ({
      username,
      requested: hasEdge(me, username), // min kant finns men inte ömsesidig -> pending
    }));
}

export async function sendSnap(input: {
  recipients: string[];
  photo: { uri: string; mimetype: string };
  text?: string;
}): Promise<void> {
  await delay();
  const me = requireUsername();
  for (const recipient of input.recipients) {
    if (!hasEdge(me, recipient) || !hasEdge(recipient, me)) {
      throw new ApiError(400, `You are not friends with ${recipient}`);
    }
  }
  // annars: "201", inget att returnera
}
