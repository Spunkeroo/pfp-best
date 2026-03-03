// Firebase Configuration for pfp.best
const firebaseConfig = {
  apiKey: "AIzaSyBk9X0jZ4fV5Gq8KmKqVhN3qL7oFmXxhQo",
  authDomain: "pfp-best.firebaseapp.com",
  databaseURL: "https://pfp-best-default-rtdb.firebaseio.com",
  projectId: "pfp-best",
  storageBucket: "pfp-best.firebasestorage.app",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

// Database references
const pfpsRef = db.ref('pfps');
const ratingsRef = db.ref('ratings');
const commentsRef = db.ref('comments');
const statsRef = db.ref('stats');

// Helper: Generate short unique ID
function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Helper: Get fingerprint for anonymous rate limiting
function getFingerprint() {
  let fp = localStorage.getItem('pfp_fp');
  if (!fp) {
    fp = 'fp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('pfp_fp', fp);
  }
  return fp;
}

// Upload PFP image to Firebase Storage
async function uploadImage(file) {
  const id = generateId();
  const ext = file.name.split('.').pop().toLowerCase();
  const ref = storage.ref(`pfps/${id}.${ext}`);

  const snapshot = await ref.put(file);
  const url = await snapshot.ref.getDownloadURL();
  return { id, url };
}

// Create PFP entry in database
async function createPfp(data) {
  const { id, url, title, category, tags } = data;
  const entry = {
    id,
    imageUrl: url,
    title: title || 'Untitled PFP',
    category: category || 'other',
    tags: tags || [],
    uploadedAt: firebase.database.ServerValue.TIMESTAMP,
    uploadedBy: getFingerprint(),
    ratingSum: 0,
    ratingCount: 0,
    ratingAvg: 0,
    upvotes: 0,
    downvotes: 0,
    commentCount: 0,
    score: 0
  };

  await pfpsRef.child(id).set(entry);

  // Increment total count
  await statsRef.child('totalPfps').transaction(count => (count || 0) + 1);

  return entry;
}

// Rate a PFP (1-10 stars)
async function ratePfp(pfpId, rating) {
  const fp = getFingerprint();
  const ratingKey = `${pfpId}_${fp}`;

  // Check if already rated
  const existing = await ratingsRef.child(ratingKey).once('value');
  const oldRating = existing.val();

  // Save rating
  await ratingsRef.child(ratingKey).set({
    pfpId,
    rating,
    fp,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });

  // Update PFP aggregate
  await pfpsRef.child(pfpId).transaction(pfp => {
    if (pfp) {
      if (oldRating) {
        // Adjust: remove old rating, add new
        pfp.ratingSum = (pfp.ratingSum || 0) - oldRating.rating + rating;
      } else {
        pfp.ratingSum = (pfp.ratingSum || 0) + rating;
        pfp.ratingCount = (pfp.ratingCount || 0) + 1;
      }
      pfp.ratingAvg = pfp.ratingCount > 0 ? pfp.ratingSum / pfp.ratingCount : 0;
      pfp.score = calculateScore(pfp);
    }
    return pfp;
  });
}

// Upvote/downvote
async function votePfp(pfpId, type) {
  const fp = getFingerprint();
  const voteKey = `votes/${pfpId}_${fp}`;
  const existing = await db.ref(voteKey).once('value');
  const oldVote = existing.val();

  if (oldVote === type) return; // Already voted same way

  await db.ref(voteKey).set(type);

  await pfpsRef.child(pfpId).transaction(pfp => {
    if (pfp) {
      if (oldVote === 'up') pfp.upvotes = Math.max(0, (pfp.upvotes || 0) - 1);
      if (oldVote === 'down') pfp.downvotes = Math.max(0, (pfp.downvotes || 0) - 1);
      if (type === 'up') pfp.upvotes = (pfp.upvotes || 0) + 1;
      if (type === 'down') pfp.downvotes = (pfp.downvotes || 0) + 1;
      pfp.score = calculateScore(pfp);
    }
    return pfp;
  });
}

// Add comment
async function addComment(pfpId, text) {
  const fp = getFingerprint();
  const commentId = generateId();
  const comment = {
    id: commentId,
    pfpId,
    text: text.slice(0, 280),
    fp,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  };

  await commentsRef.child(pfpId).child(commentId).set(comment);
  await pfpsRef.child(pfpId).child('commentCount').transaction(c => (c || 0) + 1);

  return comment;
}

// Get comments for a PFP
async function getComments(pfpId) {
  const snap = await commentsRef.child(pfpId).orderByChild('timestamp').limitToLast(50).once('value');
  const comments = [];
  snap.forEach(child => comments.push(child.val()));
  return comments;
}

// Calculate trending score (Wilson score + time decay)
function calculateScore(pfp) {
  const upvotes = pfp.upvotes || 0;
  const downvotes = pfp.downvotes || 0;
  const ratingAvg = pfp.ratingAvg || 0;
  const total = upvotes + downvotes;

  if (total === 0) return ratingAvg;

  // Wilson score lower bound
  const p = upvotes / total;
  const z = 1.96;
  const n = total;
  const wilson = (p + z * z / (2 * n) - z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)) / (1 + z * z / n);

  return (wilson * 5 + ratingAvg) / 2;
}

// Fetch PFPs with ordering
async function fetchPfps(orderBy, limit = 20, category = null) {
  let query = pfpsRef.orderByChild(orderBy).limitToLast(limit);

  const snap = await query.once('value');
  const pfps = [];
  snap.forEach(child => {
    const pfp = child.val();
    if (!category || pfp.category === category) {
      pfps.push(pfp);
    }
  });

  // Reverse for descending order
  return pfps.reverse();
}

// Fetch single PFP
async function fetchPfp(id) {
  const snap = await pfpsRef.child(id).once('value');
  return snap.val();
}

// Listen for real-time updates
function onPfpsUpdate(callback, limit = 20) {
  pfpsRef.orderByChild('score').limitToLast(limit).on('value', snap => {
    const pfps = [];
    snap.forEach(child => pfps.push(child.val()));
    callback(pfps.reverse());
  });
}

// Get PFP of the Day (highest score from last 24h)
async function getPfpOfDay() {
  const oneDayAgo = Date.now() - 86400000;
  const snap = await pfpsRef.orderByChild('uploadedAt').startAt(oneDayAgo).once('value');
  let best = null;
  snap.forEach(child => {
    const pfp = child.val();
    if (!best || (pfp.score || 0) > (best.score || 0)) {
      best = pfp;
    }
  });
  return best;
}
