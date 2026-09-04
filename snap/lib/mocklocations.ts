// Mockade platser för vänner på kartan. Inte del av backend-kontraktet —
// riktiga vänners platser kräver en location-endpoint som inte finns än.

export type MockFriendLocation = {
  username: string;
  latitude: number;
  longitude: number;
};

// Utspridda runt centrala Stockholm, bara för att visa flera markörer på kartan.
export const mockFriendLocations: MockFriendLocation[] = [
  { username: "anna", latitude: 59.3326, longitude: 18.0649 },
  { username: "moises", latitude: 59.3419, longitude: 18.0526 },
  { username: "kalle", latitude: 59.3178, longitude: 18.0713 },
  { username: "lisa", latitude: 59.3358, longitude: 18.0872 },
  { username: "sofia", latitude: 59.3106, longitude: 18.0435 },
];
