'use strict';

// ===== Dummy Data =====
const DB = {
  users: [
    { id: 1, username: 'alice', email: 'alice@example.com', password: 'password123', profileImageUrl: null },
    { id: 2, username: 'bob_rt', email: 'bob@example.com', password: 'pass1234', profileImageUrl: null },
    { id: 3, username: 'carol_dev', email: 'carol@example.com', password: 'devcarol1', profileImageUrl: null },
    { id: 4, username: 'dave_design', email: 'dave@example.com', password: 'design99', profileImageUrl: null },
    { id: 5, username: 'eve_ai', email: 'eve@example.com', password: 'aipass12', profileImageUrl: null },
  ],
  posts: [
    { id: 1, userId: 2, content: 'RaiseTechのAIコースに入学しました！これからよろしくお願いします🎉', imageUrl: null, createdAt: new Date(Date.now() - 1000 * 60 * 5) },
    { id: 2, userId: 3, content: 'Spring Bootの環境構築が完了しました。次はAPIの実装を始めます💪\n\n今日の進捗はこんな感じです！', imageUrl: null, createdAt: new Date(Date.now() - 1000 * 60 * 30) },
    { id: 3, userId: 1, content: 'RaiseTimeLineのプロトタイプ作成中です。HTML/CSS/JSだけでSPA風のUIを実装してみました！', imageUrl: null, createdAt: new Date(Date.now() - 1000 * 60 * 60) },
    { id: 4, userId: 4, content: 'UIデザインのカラースキームを検討中。TwitterライクなブルーかSlackライクなパープルか迷っています😂', imageUrl: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: 5, userId: 5, content: 'AIとプログラミングの融合って本当に面白いですね。機械学習モデルをWebアプリに組み込む実験をしています。', imageUrl: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3) },
    { id: 6, userId: 2, content: 'PostgreSQLのインデックス設計について学びました。パフォーマンスが大幅に改善されました！\n\ncreated_atにDESCインデックスを張るだけでタイムラインのクエリが10倍速くなった。', imageUrl: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) },
    { id: 7, userId: 3, content: 'JWTトークンの実装が完成！Spring Security 6とJJWTの組み合わせはなかなか複雑でしたが、ようやく動きました。', imageUrl: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8) },
    { id: 8, userId: 1, content: 'AWS S3への画像アップロード機能を設計中。マルチパートフォームデータをSpring Bootで受け取る方法を調べています。', imageUrl: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12) },
    { id: 9, userId: 4, content: 'Next.js 14のApp RouterとTailwind CSSでフロントエンドを実装中。RSCとClientコンポーネントの使い分けが面白いですね。', imageUrl: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    { id: 10, userId: 5, content: '今日でRaiseTechコースを受講してから1ヶ月が経ちました。毎日新しいことを学べて本当に楽しいです！みなさんも一緒に頑張りましょう💡', imageUrl: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36) },
  ],
  comments: [
    { id: 1, postId: 1, userId: 1, content: 'ようこそ！一緒に頑張りましょう！', createdAt: new Date(Date.now() - 1000 * 60 * 3) },
    { id: 2, postId: 1, userId: 3, content: 'お待ちしてました！わからないことあれば聞いてください😊', createdAt: new Date(Date.now() - 1000 * 60 * 2) },
    { id: 3, postId: 2, userId: 2, content: 'Spring Bootの環境構築お疲れ様です！次はコントローラーの実装ですね', createdAt: new Date(Date.now() - 1000 * 60 * 25) },
    { id: 4, postId: 2, userId: 5, content: 'Gradleの設定で詰まったら相談してください！', createdAt: new Date(Date.now() - 1000 * 60 * 20) },
    { id: 5, postId: 3, userId: 2, content: 'すごい！ハッシュルーティングの実装はどうしましたか？', createdAt: new Date(Date.now() - 1000 * 60 * 55) },
    { id: 6, postId: 4, userId: 1, content: 'ブルー系が爽やかで好きです！アクセントカラーとして使うのも良さそう', createdAt: new Date(Date.now() - 1000 * 60 * 90) },
    { id: 7, postId: 5, userId: 3, content: 'どんなモデルを使っているんですか？気になります！', createdAt: new Date(Date.now() - 1000 * 60 * 150) },
    { id: 8, postId: 7, userId: 4, content: 'Spring Security 6は設定が増えましたよね。参考にさせてもらいます！', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7) },
    { id: 9, postId: 10, userId: 1, content: '1ヶ月おめでとうございます！これからも一緒に頑張りましょう！', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 35) },
  ],
  likes: [
    { postId: 1, userId: 1 }, { postId: 1, userId: 3 }, { postId: 1, userId: 4 },
    { postId: 2, userId: 1 }, { postId: 2, userId: 5 },
    { postId: 3, userId: 2 }, { postId: 3, userId: 4 }, { postId: 3, userId: 5 },
    { postId: 4, userId: 1 }, { postId: 4, userId: 2 }, { postId: 4, userId: 3 },
    { postId: 5, userId: 1 }, { postId: 5, userId: 2 },
    { postId: 6, userId: 1 }, { postId: 6, userId: 3 },
    { postId: 7, userId: 2 }, { postId: 7, userId: 4 }, { postId: 7, userId: 5 },
    { postId: 8, userId: 3 },
    { postId: 9, userId: 1 }, { postId: 9, userId: 2 },
    { postId: 10, userId: 1 }, { postId: 10, userId: 2 }, { postId: 10, userId: 3 }, { postId: 10, userId: 4 },
  ],
  follows: [
    { followerId: 1, followingId: 2 }, { followerId: 1, followingId: 3 },
    { followerId: 2, followingId: 1 }, { followerId: 2, followingId: 3 }, { followerId: 2, followingId: 5 },
    { followerId: 3, followingId: 1 }, { followerId: 3, followingId: 4 },
    { followerId: 4, followingId: 2 }, { followerId: 4, followingId: 5 },
    { followerId: 5, followingId: 1 }, { followerId: 5, followingId: 3 },
  ],
  nextPostId: 11,
  nextCommentId: 10,
  nextUserId: 6,
};

// ===== State =====
let currentUserId = null;
let currentFollowsTargetId = null;
let currentPostDetailId = null;
let pendingDeleteType = null;
let pendingDeleteId = null;
let pendingDeletePostId = null;

// ===== Session Storage =====
function loadSession() {
  const id = sessionStorage.getItem('raisetimeline_uid');
  if (id) currentUserId = parseInt(id, 10);
}
function saveSession(userId) {
  currentUserId = userId;
  sessionStorage.setItem('raisetimeline_uid', userId);
}
function clearSession() {
  currentUserId = null;
  sessionStorage.removeItem('raisetimeline_uid');
}

// ===== Helpers =====
function getUser(id) { return DB.users.find(u => u.id === id); }
function getPost(id) { return DB.posts.find(p => p.id === id); }
function getLikeCount(postId) { return DB.likes.filter(l => l.postId === postId).length; }
function isLiked(postId, userId) { return DB.likes.some(l => l.postId === postId && l.userId === userId); }
function getComments(postId) { return DB.comments.filter(c => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt); }
function getCommentCount(postId) { return DB.comments.filter(c => c.postId === postId).length; }
function isFollowing(followerId, followingId) { return DB.follows.some(f => f.followerId === followerId && f.followingId === followingId); }
function getFollowingCount(userId) { return DB.follows.filter(f => f.followerId === userId).length; }
function getFollowerCount(userId) { return DB.follows.filter(f => f.followingId === userId).length; }
function getUserPosts(userId) { return DB.posts.filter(p => p.userId === userId).sort((a, b) => b.createdAt - a.createdAt); }

function avatarColor(username) {
  const colors = ['#1d9bf0','#794bc4','#f91880','#00ba7c','#ff7a00','#1da1f2'];
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) % colors.length;
  return colors[h];
}

function relativeTime(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  return `${Math.floor(diff / 86400)}日前`;
}

function avatarHTML(user, sizeClass = '') {
  const color = avatarColor(user.username);
  const initial = user.username[0].toUpperCase();
  if (user.profileImageUrl) {
    return `<div class="avatar ${sizeClass}" style="background:${color}"><img src="${user.profileImageUrl}" alt="${user.username}"></div>`;
  }
  return `<div class="avatar ${sizeClass}" style="background:${color}"><span>${initial}</span></div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nl2br(str) {
  return escapeHtml(str).replace(/\n/g, '<br>');
}

// ===== Toast =====
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.classList.add('hidden'), 220);
  }, 2000);
}

// ===== Modal =====
function showConfirmModal(title, message, onConfirm) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  document.getElementById('confirm-modal').classList.remove('hidden');
  const confirmBtn = document.getElementById('modal-confirm');
  const cancelBtn = document.getElementById('modal-cancel');
  const close = () => document.getElementById('confirm-modal').classList.add('hidden');
  confirmBtn.onclick = () => { close(); onConfirm(); };
  cancelBtn.onclick = close;
  document.getElementById('confirm-modal').onclick = (e) => { if (e.target === e.currentTarget) close(); };
}

// ===== Router =====
function navigate(hash) {
  window.location.hash = hash;
}

function router() {
  const hash = window.location.hash || '#login';
  const parts = hash.slice(1).split('/');
  const route = parts[0];
  const param = parts[1];

  if (!currentUserId && route !== 'login' && route !== 'register') {
    navigate('#login');
    return;
  }
  if (currentUserId && (route === 'login' || route === 'register')) {
    navigate('#timeline');
    return;
  }

  const navbar = document.getElementById('navbar');
  if (currentUserId) {
    navbar.classList.remove('hidden');
    updateNavAvatar();
  } else {
    navbar.classList.add('hidden');
  }

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  switch (route) {
    case 'login':     showScreen('login'); break;
    case 'register':  showScreen('register'); break;
    case 'timeline':  showScreen('timeline'); renderTimeline(); break;
    case 'post':      showScreen('post-detail'); renderPostDetail(parseInt(param, 10)); break;
    case 'create':    showScreen('create'); initCreateForm(); break;
    case 'profile':   showScreen('profile'); renderProfile(param === 'me' ? currentUserId : parseInt(param, 10)); break;
    case 'search':    showScreen('search'); initSearch(); break;
    case 'follows':   showScreen('follows'); initFollows(parseInt(param, 10)); break;
    default:          navigate(currentUserId ? '#timeline' : '#login');
  }
}

function showScreen(name) {
  const el = document.getElementById(`screen-${name}`);
  if (el) el.classList.add('active');
}

function updateNavAvatar() {
  const user = getUser(currentUserId);
  if (!user) return;
  const el = document.getElementById('nav-avatar-text');
  if (el) el.textContent = user.username[0].toUpperCase();
  const navAvatar = document.getElementById('nav-avatar');
  if (navAvatar) navAvatar.style.background = avatarColor(user.username);
}

// ===== SC-01 Login =====
function initLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;
  form.onsubmit = (e) => {
    e.preventDefault();
    clearLoginErrors();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    let valid = true;
    if (!email) { setError('login-email-error', 'メールアドレスを入力してください'); valid = false; }
    if (!password) { setError('login-password-error', 'パスワードを入力してください'); valid = false; }
    if (!valid) return;
    const user = DB.users.find(u => u.email === email && u.password === password);
    if (!user) { setError('login-form-error', 'メールアドレスまたはパスワードが正しくありません'); return; }
    saveSession(user.id);
    showToast(`ようこそ、${user.username}さん！`);
    navigate('#timeline');
  };
}

function clearLoginErrors() {
  ['login-email-error', 'login-password-error', 'login-form-error'].forEach(id => setError(id, ''));
}
function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

// ===== SC-02 Register =====
function initRegister() {
  const form = document.getElementById('register-form');
  if (!form) return;
  form.onsubmit = (e) => {
    e.preventDefault();
    clearRegisterErrors();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    let valid = true;
    if (!username) { setError('reg-username-error', 'ユーザー名を入力してください'); valid = false; }
    else if (username.length > 50) { setError('reg-username-error', 'ユーザー名は50文字以内にしてください'); valid = false; }
    else if (DB.users.some(u => u.username === username)) { setError('reg-username-error', 'このユーザー名はすでに使われています'); valid = false; }
    if (!email) { setError('reg-email-error', 'メールアドレスを入力してください'); valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('reg-email-error', '正しいメールアドレスを入力してください'); valid = false; }
    else if (DB.users.some(u => u.email === email)) { setError('reg-email-error', 'このメールアドレスはすでに登録されています'); valid = false; }
    if (!password) { setError('reg-password-error', 'パスワードを入力してください'); valid = false; }
    else if (password.length < 8) { setError('reg-password-error', 'パスワードは8文字以上にしてください'); valid = false; }
    else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) { setError('reg-password-error', 'パスワードは英字と数字を両方含めてください'); valid = false; }
    if (!valid) return;
    const newUser = { id: DB.nextUserId++, username, email, password, profileImageUrl: null };
    DB.users.push(newUser);
    showToast('登録が完了しました！ログインしてください');
    navigate('#login');
    document.getElementById('login-email').value = email;
  };
}

function clearRegisterErrors() {
  ['reg-username-error', 'reg-email-error', 'reg-password-error'].forEach(id => setError(id, ''));
}

// ===== SC-03 Timeline =====
function renderTimeline() {
  const container = document.getElementById('timeline-posts');
  if (!container) return;
  const sorted = [...DB.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sorted.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>まだ投稿がありません</p></div>';
    return;
  }
  container.innerHTML = sorted.map(p => renderPostCard(p)).join('');
  attachPostCardEvents(container);
}

function renderPostCard(post) {
  const user = getUser(post.userId);
  if (!user) return '';
  const liked = currentUserId ? isLiked(post.id, currentUserId) : false;
  const likeCount = getLikeCount(post.id);
  const commentCount = getCommentCount(post.id);
  const isOwner = currentUserId === post.userId;
  return `
    <div class="post-card" data-post-id="${post.id}">
      <div class="post-card-left">
        <a href="#profile/${user.id}" class="post-avatar-link">${avatarHTML(user)}</a>
      </div>
      <div class="post-card-body">
        <div class="post-card-header">
          <div class="post-card-user">
            <a href="#profile/${user.id}" class="post-username">${escapeHtml(user.username)}</a>
            <span class="post-time">${relativeTime(post.createdAt)}</span>
          </div>
          ${isOwner ? `<button class="post-delete-btn" data-action="delete-post" data-id="${post.id}">削除</button>` : ''}
        </div>
        <div class="post-text" data-action="view-post" data-id="${post.id}">${nl2br(post.content)}</div>
        ${post.imageUrl ? `<div class="post-image" data-action="view-post" data-id="${post.id}"><img src="${post.imageUrl}" alt="投稿画像" loading="lazy"></div>` : ''}
        <div class="post-actions">
          <button class="post-action-btn like-btn ${liked ? 'liked' : ''}" data-action="toggle-like" data-id="${post.id}">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                stroke="currentColor" stroke-width="2" ${liked ? 'fill="currentColor"' : 'fill="none"'}/>
            </svg>
            <span>${likeCount}</span>
          </button>
          <button class="post-action-btn comment-btn" data-action="view-post" data-id="${post.id}">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>
            </svg>
            <span>${commentCount}</span>
          </button>
        </div>
      </div>
    </div>`;
}

function attachPostCardEvents(container) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id, 10);
    if (action === 'view-post') navigate(`#post/${id}`);
    else if (action === 'toggle-like') handleToggleLike(id, btn, container);
    else if (action === 'delete-post') handleDeletePost(id);
  });
  container.addEventListener('click', (e) => {
    const link = e.target.closest('.post-avatar-link');
    if (link) { e.preventDefault(); navigate(link.getAttribute('href')); }
  });
}

// ===== SC-04 Post Detail =====
function renderPostDetail(postId) {
  currentPostDetailId = postId;
  const post = getPost(postId);
  if (!post) { navigate('#timeline'); return; }
  const user = getUser(post.userId);
  const liked = currentUserId ? isLiked(post.id, currentUserId) : false;
  const likeCount = getLikeCount(post.id);
  const isOwner = currentUserId === post.userId;

  const detailEl = document.getElementById('post-detail-content');
  detailEl.innerHTML = `
    <div class="post-detail-card">
      <div class="post-detail-header">
        <div class="post-detail-user">
          <a href="#profile/${user.id}">${avatarHTML(user, 'avatar-sm')}</a>
          <a href="#profile/${user.id}" class="post-detail-username">${escapeHtml(user.username)}</a>
        </div>
        ${isOwner ? `<button class="post-delete-btn" id="detail-delete-btn" data-id="${post.id}">削除</button>` : ''}
      </div>
      <div class="post-detail-text">${nl2br(post.content)}</div>
      ${post.imageUrl ? `<div class="post-detail-image"><img src="${post.imageUrl}" alt="投稿画像"></div>` : ''}
      <div class="post-detail-meta">${new Date(post.createdAt).toLocaleString('ja-JP')}</div>
      <div class="post-detail-actions">
        <button class="post-action-btn like-btn ${liked ? 'liked' : ''}" id="detail-like-btn" data-id="${post.id}">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke="currentColor" stroke-width="2" ${liked ? 'fill="currentColor"' : 'fill="none"'}/>
          </svg>
          <span id="detail-like-count">${likeCount}</span> いいね
        </button>
      </div>
    </div>`;

  const deleteBtn = document.getElementById('detail-delete-btn');
  if (deleteBtn) deleteBtn.onclick = () => handleDeletePost(postId);

  const likeBtn = document.getElementById('detail-like-btn');
  if (likeBtn) {
    likeBtn.onclick = () => {
      if (!currentUserId) return;
      toggleLike(postId, currentUserId);
      const nowLiked = isLiked(postId, currentUserId);
      likeBtn.classList.toggle('liked', nowLiked);
      const path = likeBtn.querySelector('path');
      if (path) path.setAttribute('fill', nowLiked ? 'currentColor' : 'none');
      document.getElementById('detail-like-count').textContent = getLikeCount(postId);
    };
  }

  renderComments(postId);
  initCommentForm(postId);
}

function renderComments(postId) {
  const list = document.getElementById('post-comments-list');
  if (!list) return;
  const comments = getComments(postId);
  if (comments.length === 0) {
    list.innerHTML = '<div class="no-comments">まだコメントはありません</div>';
    return;
  }
  list.innerHTML = comments.map(c => {
    const user = getUser(c.userId);
    if (!user) return '';
    const isOwner = currentUserId === c.userId;
    return `
      <div class="comment-item" data-comment-id="${c.id}">
        <a href="#profile/${user.id}">${avatarHTML(user, 'avatar-sm')}</a>
        <div class="comment-body">
          <div class="comment-header">
            <div>
              <a href="#profile/${user.id}" class="comment-username">${escapeHtml(user.username)}</a>
              <span class="comment-time"> · ${relativeTime(c.createdAt)}</span>
            </div>
            ${isOwner ? `<button class="comment-delete-btn" data-comment-id="${c.id}">削除</button>` : ''}
          </div>
          <div class="comment-text">${nl2br(c.content)}</div>
        </div>
      </div>`;
  }).join('');

  list.querySelectorAll('.comment-delete-btn').forEach(btn => {
    btn.onclick = () => {
      const cid = parseInt(btn.dataset.commentId, 10);
      showConfirmModal('コメントを削除', 'このコメントを削除しますか？', () => {
        const idx = DB.comments.findIndex(c => c.id === cid);
        if (idx !== -1) DB.comments.splice(idx, 1);
        renderComments(postId);
        showToast('コメントを削除しました');
      });
    };
  });
}

function initCommentForm(postId) {
  const form = document.getElementById('comment-form');
  const input = document.getElementById('comment-input');
  const countEl = document.getElementById('comment-char-count');
  if (!form || !input) return;

  input.value = '';
  updateCharCount(input, countEl, 140);
  input.oninput = () => updateCharCount(input, countEl, 140);

  form.onsubmit = (e) => {
    e.preventDefault();
    const content = input.value.trim();
    if (!content) return;
    if (content.length > 140) return;
    DB.comments.push({
      id: DB.nextCommentId++,
      postId,
      userId: currentUserId,
      content,
      createdAt: new Date(),
    });
    input.value = '';
    updateCharCount(input, countEl, 140);
    renderComments(postId);
    showToast('コメントを投稿しました');
  };
}

// ===== SC-05 Create Post =====
function initCreateForm() {
  const form = document.getElementById('create-post-form');
  const textarea = document.getElementById('post-content');
  const countEl = document.getElementById('post-char-count');
  const imageInput = document.getElementById('image-upload');
  const preview = document.getElementById('image-preview');
  const previewContainer = document.getElementById('image-preview-container');
  const removeBtn = document.getElementById('image-remove-btn');
  if (!form) return;

  const user = getUser(currentUserId);
  if (user) {
    const createAvatar = document.getElementById('create-avatar');
    const avatarText = document.getElementById('create-avatar-text');
    if (createAvatar) createAvatar.style.background = avatarColor(user.username);
    if (avatarText) avatarText.textContent = user.username[0].toUpperCase();
  }

  textarea.value = '';
  setError('post-content-error', '');
  setError('image-error', '');
  previewContainer.classList.add('hidden');
  preview.src = '';
  updateCharCount(textarea, countEl, 280);
  textarea.oninput = () => updateCharCount(textarea, countEl, 280);

  imageInput.onchange = () => {
    setError('image-error', '');
    const file = imageInput.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setError('image-error', 'JPEG、PNG、GIF形式の画像を選択してください');
      imageInput.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('image-error', '画像サイズは5MB以下にしてください');
      imageInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      preview.src = ev.target.result;
      previewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  };

  removeBtn.onclick = () => {
    preview.src = '';
    previewContainer.classList.add('hidden');
    imageInput.value = '';
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    setError('post-content-error', '');
    const content = textarea.value.trim();
    if (!content) { setError('post-content-error', '投稿内容を入力してください'); return; }
    if (content.length > 280) { setError('post-content-error', '280文字以内で入力してください'); return; }
    const imageUrl = preview.src || null;
    DB.posts.push({
      id: DB.nextPostId++,
      userId: currentUserId,
      content,
      imageUrl: imageUrl && imageUrl !== window.location.href ? imageUrl : null,
      createdAt: new Date(),
    });
    showToast('投稿しました！');
    navigate('#timeline');
  };
}

// ===== SC-06 Profile =====
function renderProfile(userId) {
  const user = getUser(userId);
  const container = document.getElementById('profile-content');
  if (!user || !container) return;

  const followingCount = getFollowingCount(userId);
  const followerCount = getFollowerCount(userId);
  const isSelf = currentUserId === userId;
  const following = !isSelf && isFollowing(currentUserId, userId);
  const posts = getUserPosts(userId);

  container.innerHTML = `
    <div class="profile-header">
      <div class="profile-top">
        ${avatarHTML(user, 'avatar-xl')}
        ${!isSelf ? `
          <button class="btn ${following ? 'btn-unfollow' : 'btn-follow'}" id="profile-follow-btn" data-user-id="${userId}">
            ${following ? 'フォロー解除' : 'フォローする'}
          </button>` : ''}
      </div>
      <div class="profile-username">${escapeHtml(user.username)}</div>
      <div class="profile-stats">
        <span class="profile-stat" data-action="show-following" data-user-id="${userId}">
          <strong>${followingCount}</strong> フォロー中
        </span>
        <span class="profile-stat" data-action="show-followers" data-user-id="${userId}">
          <strong>${followerCount}</strong> フォロワー
        </span>
      </div>
    </div>
    <div class="profile-posts-title">投稿 (${posts.length}件)</div>
    <div id="profile-posts-list">
      ${posts.length === 0
        ? '<div class="profile-empty">まだ投稿がありません</div>'
        : posts.map(p => renderPostCard(p)).join('')}
    </div>`;

  const followBtn = document.getElementById('profile-follow-btn');
  if (followBtn) {
    followBtn.onclick = () => {
      const uid = parseInt(followBtn.dataset.userId, 10);
      const nowFollowing = isFollowing(currentUserId, uid);
      if (nowFollowing) {
        const idx = DB.follows.findIndex(f => f.followerId === currentUserId && f.followingId === uid);
        if (idx !== -1) DB.follows.splice(idx, 1);
        followBtn.textContent = 'フォローする';
        followBtn.className = 'btn btn-follow';
        showToast('フォローを解除しました');
      } else {
        DB.follows.push({ followerId: currentUserId, followingId: uid });
        followBtn.textContent = 'フォロー解除';
        followBtn.className = 'btn btn-unfollow';
        showToast(`${user.username}さんをフォローしました`);
      }
      container.querySelector('[data-action="show-followers"] strong').textContent = getFollowerCount(uid);
    };
  }

  container.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (el.dataset.action === 'show-following') navigate(`#follows/${el.dataset.userId}`);
      else if (el.dataset.action === 'show-followers') {
        navigate(`#follows/${el.dataset.userId}`);
        setTimeout(() => switchFollowTab('followers'), 50);
      }
    });
  });

  const postsList = document.getElementById('profile-posts-list');
  if (postsList) attachPostCardEvents(postsList);
}

// ===== SC-07 Search =====
function initSearch() {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;
  input.value = '';
  results.innerHTML = '<div class="search-hint">ユーザー名を入力して検索してください</div>';
  input.oninput = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.innerHTML = '<div class="search-hint">ユーザー名を入力して検索してください</div>'; return; }
    const found = DB.users.filter(u => u.username.toLowerCase().includes(q));
    if (found.length === 0) { results.innerHTML = '<div class="search-hint">該当するユーザーが見つかりません</div>'; return; }
    results.innerHTML = found.map(u => renderUserItem(u)).join('');
    attachUserItemEvents(results);
  };
}

// ===== SC-08 Follows =====
function initFollows(userId) {
  currentFollowsTargetId = userId;
  const user = getUser(userId);
  const titleEl = document.getElementById('follows-title');
  if (user && titleEl) titleEl.textContent = `${user.username} のフォロー`;

  document.getElementById('tab-following').classList.add('active');
  document.getElementById('tab-followers').classList.remove('active');

  document.getElementById('tab-following').onclick = () => switchFollowTab('following');
  document.getElementById('tab-followers').onclick = () => switchFollowTab('followers');

  switchFollowTab('following');
}

function switchFollowTab(tab) {
  document.getElementById('tab-following').classList.toggle('active', tab === 'following');
  document.getElementById('tab-followers').classList.toggle('active', tab === 'followers');

  const userId = currentFollowsTargetId;
  const list = document.getElementById('follows-list');
  let users = [];
  if (tab === 'following') {
    users = DB.follows.filter(f => f.followerId === userId).map(f => getUser(f.followingId)).filter(Boolean);
  } else {
    users = DB.follows.filter(f => f.followingId === userId).map(f => getUser(f.followerId)).filter(Boolean);
  }
  if (users.length === 0) {
    list.innerHTML = `<div class="search-hint">${tab === 'following' ? 'フォロー中のユーザーはいません' : 'フォロワーはいません'}</div>`;
    return;
  }
  list.innerHTML = users.map(u => renderUserItem(u)).join('');
  attachUserItemEvents(list);
}

// ===== User Item =====
function renderUserItem(user) {
  const isSelf = currentUserId === user.id;
  const following = !isSelf && isFollowing(currentUserId, user.id);
  return `
    <div class="user-item" data-user-id="${user.id}">
      <a href="#profile/${user.id}">${avatarHTML(user)}</a>
      <div class="user-item-info">
        <span class="user-item-name" data-action="goto-profile" data-user-id="${user.id}">${escapeHtml(user.username)}</span>
      </div>
      ${!isSelf ? `
        <button class="btn ${following ? 'btn-unfollow btn-sm' : 'btn-follow btn-sm'}" data-action="toggle-follow" data-user-id="${user.id}">
          ${following ? 'フォロー解除' : 'フォローする'}
        </button>` : ''}
    </div>`;
}

function attachUserItemEvents(container) {
  container.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const uid = parseInt(el.dataset.userId, 10);
    if (el.dataset.action === 'goto-profile') { navigate(`#profile/${uid}`); }
    else if (el.dataset.action === 'toggle-follow') {
      const user = getUser(uid);
      const nowFollowing = isFollowing(currentUserId, uid);
      if (nowFollowing) {
        const idx = DB.follows.findIndex(f => f.followerId === currentUserId && f.followingId === uid);
        if (idx !== -1) DB.follows.splice(idx, 1);
        el.textContent = 'フォローする';
        el.className = 'btn btn-follow btn-sm';
        showToast('フォローを解除しました');
      } else {
        DB.follows.push({ followerId: currentUserId, followingId: uid });
        el.textContent = 'フォロー解除';
        el.className = 'btn btn-unfollow btn-sm';
        showToast(user ? `${user.username}さんをフォローしました` : 'フォローしました');
      }
    }
  });
}

// ===== Like =====
function toggleLike(postId, userId) {
  const idx = DB.likes.findIndex(l => l.postId === postId && l.userId === userId);
  if (idx !== -1) DB.likes.splice(idx, 1);
  else DB.likes.push({ postId, userId });
}

function handleToggleLike(postId, btn, container) {
  if (!currentUserId) return;
  toggleLike(postId, currentUserId);
  const liked = isLiked(postId, currentUserId);
  btn.classList.toggle('liked', liked);
  const path = btn.querySelector('path');
  if (path) path.setAttribute('fill', liked ? 'currentColor' : 'none');
  const countEl = btn.querySelector('span');
  if (countEl) countEl.textContent = getLikeCount(postId);
}

// ===== Delete Post =====
function handleDeletePost(postId) {
  showConfirmModal('投稿を削除', 'この投稿を削除しますか？紐づくコメント・いいねも削除されます。', () => {
    const idx = DB.posts.findIndex(p => p.id === postId);
    if (idx !== -1) DB.posts.splice(idx, 1);
    const cIdxs = DB.comments.reduce((acc, c, i) => { if (c.postId === postId) acc.push(i); return acc; }, []);
    for (let i = cIdxs.length - 1; i >= 0; i--) DB.comments.splice(cIdxs[i], 1);
    const lIdxs = DB.likes.reduce((acc, l, i) => { if (l.postId === postId) acc.push(i); return acc; }, []);
    for (let i = lIdxs.length - 1; i >= 0; i--) DB.likes.splice(lIdxs[i], 1);
    showToast('投稿を削除しました');
    const hash = window.location.hash;
    if (hash.startsWith('#post/')) navigate('#timeline');
    else renderTimeline();
  });
}

// ===== Char Count =====
function updateCharCount(input, countEl, max) {
  if (!countEl) return;
  const remaining = max - input.value.length;
  countEl.textContent = remaining;
  countEl.className = 'char-count';
  if (remaining <= 0) countEl.classList.add('danger');
  else if (remaining <= 20) countEl.classList.add('warning');
}

// ===== Logout =====
function initLogout() {
  const btn = document.getElementById('logout-btn');
  if (btn) btn.onclick = () => {
    clearSession();
    showToast('ログアウトしました');
    navigate('#login');
  };
}

// ===== Init =====
function init() {
  loadSession();
  initLogin();
  initRegister();
  initLogout();
  window.addEventListener('hashchange', router);
  router();
}

document.addEventListener('DOMContentLoaded', init);
