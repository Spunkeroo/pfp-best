// Firebase Configuration for pfp.best
const firebaseConfig = {
  apiKey: "AIzaSyBXAqOFYo8_lWPYTzSLqvtPYClDqrlih9Q",
  authDomain: "predict-network-ec767.firebaseapp.com",
  databaseURL: "https://predict-network-ec767-default-rtdb.firebaseio.com",
  projectId: "predict-network-ec767",
  storageBucket: "predict-network-ec767.firebasestorage.app",
  messagingSenderId: "487118700387",
  appId: "1:487118700387:web:2bae41728d3a6e3b515d56"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Database references (namespaced under pfpbest/)
const pfpsRef = db.ref('pfpbest/pfps');
const ratingsRef = db.ref('pfpbest/ratings');
const commentsRef = db.ref('pfpbest/comments');
const statsRef = db.ref('pfpbest/stats');

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

// Upload PFP image — compress and store as base64 in DB (no Storage auth needed)
async function uploadImage(file) {
  const id = generateId();

  // Resize and compress image to keep DB size reasonable
  const dataUrl = await compressImage(file, 400, 0.8);
  return { id, url: dataUrl };
}

// Compress image to max dimension and quality
function compressImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;

        // Scale down if needed
        if (w > maxSize || h > maxSize) {
          if (w > h) {
            h = Math.round(h * maxSize / w);
            w = maxSize;
          } else {
            w = Math.round(w * maxSize / h);
            h = maxSize;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  const existing = await db.ref('pfpbest/' + voteKey).once('value');
  const oldVote = existing.val();

  if (oldVote === type) return;

  await db.ref('pfpbest/' + voteKey).set(type);

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
    if (!category || category === 'all' || pfp.category === category) {
      pfps.push(pfp);
    }
  });

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
