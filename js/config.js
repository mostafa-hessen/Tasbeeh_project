const SUPABASE_URL = "https://oamkkuskpzectkixynyb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbWtrdXNrcHplY3RraXh5bnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzg0MTksImV4cCI6MjA4OTg1NDQxOX0.FDTCL_fgRsHkUmVk3OYSwU7eS1EgtSRBxL_uaSLCvhM";
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
