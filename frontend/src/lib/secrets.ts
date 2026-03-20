const STORAGE_KEY = "reflex_match_secrets";

type MatchSecret = {
  move: number;
  secret: string;
};

export function saveMatchSecret(matchId: string, move: number, secret: string) {
  const data = getAllSecrets();
  data[matchId] = { move, secret };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export function getMatchSecret(matchId: string): MatchSecret | null {
  const data = getAllSecrets();
  return data[matchId] || null;
}

export function removeMatchSecret(matchId: string) {
  const data = getAllSecrets();
  delete data[matchId];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

function getAllSecrets(): Record<string, MatchSecret> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}
