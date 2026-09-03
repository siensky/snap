// Kontraktets typer + ApiError.
// Bindande — dessa former får inte ändras (fältnamn, statuskoder, texter).
// Delas av både api.mock.ts (nu) och api.real.ts (onsdag).

export type ApiUser = {
  username: string;
  created_at: string; // ISO-sträng
};

export type AuthResponse = {
  tokens: { access_token: string; refresh_token: string };
  user: ApiUser;
};

export type ApiFriend = {
  username: string;
  created_at: string;
  mutual: boolean;
};

export type AddFriendResponse = {
  status: 'pending' | 'friends';
};

// INTE del av backend-kontraktet. Stödtyp för AddFriend-vyns sökning.
// Onsdag: kräver en riktig endpoint eller klient-sidig härledning.
// requested = jag har redan skickat en pending-förfrågan till personen.
export type UserSearchResult = {
  username: string;
  requested: boolean;
};

// Alla fel från API:et, mock som riktigt.
// code = HTTP-status, message = backendens text (visas för användaren rakt av).
export class ApiError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
