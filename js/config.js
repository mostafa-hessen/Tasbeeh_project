const SUPABASE_URL = "https://oamkkuskpzectkixynyb.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_WAHbIX4RQ0hsfDk-xuz3tA_Jat0uTig";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let state = {
  users: [],
  challenges: [],
  progress: {},
  logs: [],
  badges: [],
  dailyMsg: "",
  currentUser: null,
  currentChallengeId: "",
  subGoal: 33,
  soundOn: true,
  pendingActions: [],
};

let deferredPrompt;
let syncLockPromise = null;
let realtimeChannel = null;
