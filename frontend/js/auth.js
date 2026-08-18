/* ═══════════════════════════════════════════════
   CampusBridge — Shared Auth + Nav helper
   Include this on every authenticated page
═══════════════════════════════════════════════ */

// ─── Theme Initialization ───
const currentTheme = localStorage.getItem('cb_theme') || 'dark';
if (currentTheme === 'light') document.documentElement.classList.add('light-mode');

const API = 'http://localhost:5000/api';

// ─── Token helpers ───
function getToken()  { return localStorage.getItem('cb_token'); }
function getUser()   { return JSON.parse(localStorage.getItem('cb_user') || 'null'); }
function avatarUrl(filename) {
  if (!filename) return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23d97706'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='white' font-size='16' font-family='Inter' dominant-baseline='middle'%3E%3F%3C/text%3E%3C/svg%3E`;
  if (filename.startsWith('http')) return filename;
  return `http://localhost:5000/uploads/${filename}`;
}

// ─── Authenticated fetch ───
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body instanceof FormData) delete headers['Content-Type'];
  const res = await fetch(API + endpoint, { ...options, headers });
  if (res.status === 401) { logout(); return; }
  return res;
}

// ─── Logout ───
function logout() {
  localStorage.removeItem('cb_token');
  localStorage.removeItem('cb_user');
  window.location.href = 'index.html';
}

// ─── Guard: redirect if not logged in ───
function requireAuth() {
  if (!getToken()) { window.location.href = 'index.html'; return false; }
  return true;
}

// ─── Render shared nav ───
function renderNav(activePage = '') {
  if (!requireAuth()) return;
  const user = getUser();
  if (!user) { logout(); return; }

  const navHTML = `
  <nav id="cb-nav">
    <a href="dashboard.html" class="nav-logo">
      <div class="nav-logo-mark">CB</div>
      <span class="nav-logo-text">Campus<span>Bridge</span></span>
    </a>

    <div class="nav-search-wrap">
      <div class="nav-search-box">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" id="nav-search-input" placeholder="Search people, courses..." autocomplete="off" />
      </div>
      <div id="nav-search-results" class="search-dropdown"></div>
    </div>

    <ul class="nav-links">
      <li><a href="feed.html" class="${activePage==='feed'?'active':''}">Feed</a></li>
      <li><a href="courses.html" class="${activePage==='courses'?'active':''}">Courses</a></li>
      <li><a href="notices.html" class="${activePage==='notices'?'active':''}">Notices</a></li>
      <li><a href="leaderboard.html" class="${activePage==='leaderboard'?'active':''}">Leaderboard</a></li>
      <li><a href="mentorship.html" class="${activePage==='mentorship'?'active':''}">Mentorship</a></li>
      <li><a href="alumni.html" class="${activePage==='alumni'?'active':''}">Alumni</a></li>
      <li><a href="chat.html" class="${activePage==='chat'?'active':''}">Chat</a></li>
      <li><a href="ai.html" class="${activePage==='ai'?'active':''}" style="${activePage==='ai'?'':'background:linear-gradient(90deg,rgba(245,158,11,0.15),rgba(20,184,166,0.1));border:1px solid rgba(245,158,11,0.25);border-radius:8px;'}">✨ AI</a></li>
    </ul>

    <div class="nav-right">
      <button id="theme-toggle" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">${currentTheme === 'light' ? '🌙' : '☀️'}</button>
      <a href="dm.html" class="nav-dm-btn" title="Messages">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span id="dm-unread-badge" class="dm-badge hidden">0</span>
      </a>

      <div class="nav-profile-wrap">
        <button class="nav-profile-btn" id="nav-profile-btn">
          <img id="nav-avatar-img" src="${avatarUrl(user.avatar)}" alt="avatar" />
          <span class="nav-profile-name">${user.fullName.split(' ')[0]}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div class="nav-profile-dropdown" id="nav-profile-dropdown">
          <a href="profile.html?id=${user.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            My Profile
          </a>
          ${user.role === 'Professor' ? `<a href="analytics.html">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Analytics
          </a>` : ''}
          <div class="dropdown-divider"></div>
          <button onclick="logout()" class="dropdown-logout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>

    <button class="nav-hamburger" id="nav-hamburger">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
  </nav>
  `;

  document.body.insertAdjacentHTML('afterbegin', navHTML);
  initNav();
}

function initNav() {
  // Scroll style
  window.addEventListener('scroll', () => {
    document.getElementById('cb-nav')?.classList.toggle('scrolled', window.scrollY > 10);
  });

  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const isLight = document.documentElement.classList.toggle('light-mode');
    localStorage.setItem('cb_theme', isLight ? 'light' : 'dark');
    document.getElementById('theme-toggle').textContent = isLight ? '🌙' : '☀️';
  });

  // Profile dropdown toggle
  document.getElementById('nav-profile-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('nav-profile-dropdown')?.classList.toggle('open');
  });
  document.addEventListener('click', () => {
    document.getElementById('nav-profile-dropdown')?.classList.remove('open');
    document.getElementById('nav-search-results')?.classList.remove('open');
  });

  // Hamburger
  document.getElementById('nav-hamburger')?.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.toggle('open');
  });

  // Live search
  let searchTimer;
  const searchInput = document.getElementById('nav-search-input');
  const searchResults = document.getElementById('nav-search-results');
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const q = e.target.value.trim();
    if (!q) { searchResults.classList.remove('open'); return; }
    searchTimer = setTimeout(() => performSearch(q), 300);
  });
  searchInput?.addEventListener('click', (e) => e.stopPropagation());
  searchResults?.addEventListener('click', (e) => e.stopPropagation());

  // DM unread count
  loadUnreadCount();
}

async function performSearch(query) {
  const results = document.getElementById('nav-search-results');
  results.innerHTML = '<div class="search-loading">Searching...</div>';
  results.classList.add('open');
  try {
    const res = await apiFetch(`/users?search=${encodeURIComponent(query)}`);
    const users = await res.json();
    if (!users.length) {
      results.innerHTML = '<div class="search-empty">No results found</div>';
      return;
    }
    results.innerHTML = users.slice(0, 8).map(u => `
      <a href="profile.html?id=${u._id}" class="search-result-item">
        <img src="${avatarUrl(u.avatar)}" class="search-avatar" alt="">
        <div class="search-info">
          <span class="search-name">${u.fullName}</span>
          <span class="search-role ${u.role.toLowerCase()}">${u.role}${u.department ? ' · ' + u.department : ''}${u.company ? ' · ' + u.company : ''}</span>
        </div>
      </a>
    `).join('');
  } catch {
    results.innerHTML = '<div class="search-empty">Search failed</div>';
  }
}

async function loadUnreadCount() {
  try {
    const res = await apiFetch('/dm/unread-count');
    if (!res) return;
    const { count } = await res.json();
    const badge = document.getElementById('dm-unread-badge');
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle('hidden', count === 0);
    }
  } catch {}
}

// ─── Shared Nav CSS ───
const navCSS = `
  #cb-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 999;
    height: 64px; display: flex; align-items: center; gap: 1rem;
    padding: 0 1.5rem;
    background: rgba(10,14,26,0.82);
    backdrop-filter: blur(24px) saturate(180%);
    border-bottom: 1px solid rgba(245,158,11,0.1);
    transition: background 0.3s, border-color 0.3s;
    font-family: 'Inter', sans-serif;
  }
  #cb-nav.scrolled { background: rgba(10,14,26,0.96); border-bottom-color: rgba(245,158,11,0.2); }
  body { padding-top: 64px; }

  .nav-logo { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; flex-shrink: 0; }
  .nav-logo-mark { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg,#d97706,#f59e0b,#fbbf24); display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk',sans-serif; font-size: 0.9rem; font-weight: 700; color: #fff; box-shadow: 0 0 18px rgba(245,158,11,0.5); }
  .nav-logo-text { font-family: 'Space Grotesk',sans-serif; font-size: 1.1rem; font-weight: 700; color: #fff; }
  .nav-logo-text span { background: linear-gradient(90deg,#fbbf24,#14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

  .nav-search-wrap { position: relative; flex: 1; min-width: 150px; max-width: 320px; margin: 0 0.5rem; }
  .nav-search-box { display: flex; align-items: center; gap: 0.5rem; background: rgba(15,20,35,0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.4rem 0.9rem; transition: all 0.3s ease; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); }
  .nav-search-box:focus-within { background: rgba(15,20,35,0.9); border-color: rgba(245,158,11,0.4); box-shadow: 0 0 0 2px rgba(245,158,11,0.1), inset 0 2px 4px rgba(0,0,0,0.2); transform: scale(1.01); }
  .nav-search-box svg { color: #94a3b8; flex-shrink: 0; transition: color 0.3s; }
  .nav-search-box:focus-within svg { color: #f59e0b; }
  .nav-search-box input { background: transparent; border: none; outline: none; color: #f1f5f9; font-size: 0.82rem; font-family: 'Inter',sans-serif; width: 100%; font-weight: 500; }
  .nav-search-box input::placeholder { color: #71717a; font-weight: 400; }

  .search-dropdown { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: rgba(12,17,30,0.98); border: 1px solid rgba(245,158,11,0.18); border-radius: 14px; overflow: hidden; backdrop-filter: blur(20px); display: none; z-index: 1000; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
  .search-dropdown.open { display: block; }
  .search-result-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; text-decoration: none; transition: background 0.2s; }
  .search-result-item:hover { background: rgba(245,158,11,0.08); }
  .search-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid rgba(245,158,11,0.18); }
  .search-info { display: flex; flex-direction: column; }
  .search-name { font-size: 0.85rem; font-weight: 600; color: #f1f5f9; }
  .search-role { font-size: 0.72rem; color: #a1a1aa; margin-top: 1px; }
  .search-role.student { color: #fbbf24; } .search-role.professor { color: #2dd4bf; } .search-role.alumni { color: #fb7185; }
  .search-loading, .search-empty { padding: 1rem; text-align: center; font-size: 0.82rem; color: #57534e; }

  .nav-links { display: flex; list-style: none; gap: 0.2rem; align-items: center; }
  .nav-links a { position: relative; color: #94a3b8; text-decoration: none; font-size: 0.82rem; font-weight: 600; padding: 0.4rem 0.65rem; border-radius: 8px; transition: all 0.2s ease; white-space: nowrap; }
  .nav-links a:hover { color: #fff; background: rgba(255,255,255,0.06); transform: translateY(-1px); }
  .nav-links a.active { color: #fbbf24; background: rgba(245,158,11,0.12); box-shadow: inset 0 0 0 1px rgba(245,158,11,0.2); }
  .nav-links a.active::after { content: ''; position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }

  .nav-right { display: flex; align-items: center; gap: 0.75rem; margin-left: auto; flex-shrink: 0; }

  .nav-dm-btn { position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 10px; background: rgba(15,20,35,0.7); border: 1px solid rgba(245,158,11,0.12); color: #a1a1aa; text-decoration: none; transition: all 0.2s; }
  .nav-dm-btn:hover { color: #fff; border-color: rgba(245,158,11,0.35); background: rgba(245,158,11,0.1); }
  .dm-badge { position: absolute; top: -4px; right: -4px; width: 18px; height: 18px; border-radius: 50%; background: #ef4444; color: #fff; font-size: 0.6rem; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 2px solid #0a0e1a; }
  .dm-badge.hidden { display: none; }

  .nav-profile-wrap { position: relative; }
  .nav-profile-btn { display: flex; align-items: center; gap: 0.5rem; background: rgba(15,20,35,0.7); border: 1px solid rgba(245,158,11,0.12); border-radius: 10px; padding: 0.35rem 0.75rem 0.35rem 0.4rem; cursor: pointer; color: #f1f5f9; transition: all 0.2s; }
  .nav-profile-btn:hover { border-color: rgba(245,158,11,0.35); background: rgba(245,158,11,0.08); }
  .nav-profile-btn img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(245,158,11,0.25); }
  .nav-profile-name { font-size: 0.82rem; font-weight: 500; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .nav-profile-dropdown { position: absolute; top: calc(100% + 8px); right: 0; min-width: 180px; background: rgba(12,17,30,0.98); border: 1px solid rgba(245,158,11,0.18); border-radius: 14px; backdrop-filter: blur(20px); display: none; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); z-index: 1000; }
  .nav-profile-dropdown.open { display: block; }
  .nav-profile-dropdown a { display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem 1rem; color: #a1a1aa; text-decoration: none; font-size: 0.83rem; transition: all 0.2s; }
  .nav-profile-dropdown a:hover { color: #fff; background: rgba(245,158,11,0.08); }
  .dropdown-divider { height: 1px; background: rgba(245,158,11,0.1); margin: 0.25rem 0; }
  .dropdown-logout { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.7rem 1rem; background: none; border: none; color: #f87171; font-size: 0.83rem; cursor: pointer; font-family: 'Inter',sans-serif; transition: all 0.2s; text-align: left; }
  .dropdown-logout:hover { background: rgba(239,68,68,0.1); }

  .nav-hamburger { display: none; background: none; border: none; cursor: pointer; color: #a1a1aa; margin-left: 0.5rem; }

  @media (max-width: 1200px) { .nav-links { display: none; } .nav-links.open { display: flex; flex-direction: column; position: absolute; top: 64px; left: 0; right: 0; background: rgba(10,14,26,0.98); border-bottom: 1px solid rgba(245,158,11,0.15); padding: 1rem; gap: 0.25rem; } .nav-hamburger { display: flex; } }
  @media (max-width: 640px) { .nav-search-wrap { max-width: 160px; min-width: 120px; } .nav-profile-name { display: none; } }
`;

// Inject nav CSS
(function injectNavCSS() {
  const style = document.createElement('style');
  style.textContent = navCSS;
  document.head.appendChild(style);
})();

// ─── Shared utility: time-ago ───
function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return Math.floor(secs/60) + 'm ago';
  if (secs < 86400) return Math.floor(secs/3600) + 'h ago';
  if (secs < 604800) return Math.floor(secs/86400) + 'd ago';
  return new Date(date).toLocaleDateString();
}

// ─── Role badge ───
function roleBadge(role) {
  const map = { Student: 'badge-student', Professor: 'badge-professor', Alumni: 'badge-alumni' };
  return `<span class="role-badge ${map[role]||''}">${role}</span>`;
}

// ─── Post Rendering ───
function buildPostCard(post) {
  const myUser = getUser();
  const isOwn = post.author?._id === myUser?.id || post.author?._id === myUser?._id;
  const isLiked = post.likes?.some(l => (l._id || l) === (myUser?.id || myUser?._id));
  const div = document.createElement('div');
  div.className = 'post-card';
  div.id = `post-${post._id}`;
  div.innerHTML = `
    <div class="post-header">
      <a href="profile.html?id=${post.author?._id}"><img src="${avatarUrl(post.author?.avatar)}" class="post-avatar" alt=""/></a>
      <div class="post-author-info">
        <a href="profile.html?id=${post.author?._id}" class="post-author-name">${post.author?.fullName}</a>
        ${roleBadge(post.author?.role||'Student')}
        <div class="post-meta">${timeAgo(post.createdAt)}</div>
      </div>
      ${isOwn ? `<button class="post-delete" onclick="deletePost('${post._id}',this)" title="Delete post">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>` : ''}
    </div>
    ${post.body ? `<div class="post-body">${post.body}</div>` : ''}
    ${post.image ? `<img src="http://localhost:5000/uploads/${post.image}" class="post-image" alt="post image"/>` : ''}
    <div class="post-actions">
      <button class="action-btn like-btn ${isLiked?'liked':''}" data-id="${post._id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${isLiked?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span class="like-count">${post.likes?.length||0}</span>
      </button>
      <button class="action-btn comment-toggle" onclick="toggleComments('${post._id}',this)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>${post.comments?.length||0} Comments</span>
      </button>
      <a href="dm.html?user=${post.author?._id}" class="action-btn" title="Send DM" style="text-decoration:none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </a>
    </div>
    <div class="comments-section" id="comments-${post._id}">
      <div class="comments-list" id="clist-${post._id}">
        ${buildComments(post.comments||[], post._id)}
      </div>
      <div class="add-comment">
        <img src="${avatarUrl(myUser?.avatar)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(245,158,11,0.15)"/>
        <input type="text" placeholder="Write a comment..." id="cinput-${post._id}" onkeydown="if(event.key==='Enter')addComment('${post._id}')"/>
        <button class="cb-btn cb-btn-primary cb-btn-sm" onclick="addComment('${post._id}')">Send</button>
      </div>
    </div>`;

  div.querySelector('.like-btn').addEventListener('click', () => toggleLike(post._id, div.querySelector('.like-btn')));
  return div;
}

function buildComments(comments, postId) {
  const myUser = getUser();
  if (!comments.length) return '<p style="color:#475569;font-size:0.78rem;margin-bottom:0.5rem">No comments yet.</p>';
  
  const grouped = {};
  const topLevel = [];
  comments.forEach(c => {
    const pId = c.parentId || 'root';
    if (!grouped[pId]) grouped[pId] = [];
    grouped[pId].push(c);
    if (pId === 'root') topLevel.push(c);
  });

  function renderList(list) {
    return list.map(c => {
      const replies = grouped[c._id] || [];
      const isLiked = c.likes?.includes(myUser?._id || myUser?.id);
      return `
        <div class="comment-item" style="margin-bottom: 0.5rem; align-items: stretch;">
          <a href="profile.html?id=${c.author?._id}" style="flex-shrink:0"><img src="${avatarUrl(c.author?.avatar)}" class="comment-avatar"/></a>
          <div class="comment-bubble-wrap" style="flex:1">
            <div class="comment-bubble">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <a href="profile.html?id=${c.author?._id}" class="comment-name">${c.author?.fullName}</a>
                ${c.author?._id === myUser?.id || c.author?._id === myUser?._id ? `<button class="comment-del" onclick="deleteComment('${postId}','${c._id}',this)">✕</button>` : ''}
              </div>
              <div class="comment-text">${c.text}</div>
              <div class="comment-time">${timeAgo(c.createdAt)}</div>
            </div>
            <div class="comment-actions" style="display:flex; gap: 1rem; font-size: 0.75rem; font-weight:600; margin-top: 0.4rem; margin-left: 0.5rem; color: var(--muted)">
              <span class="c-action-btn ${isLiked ? 'liked' : ''}" style="cursor:pointer; display:flex; align-items:center; gap:0.3rem; color: ${isLiked ? '#e11d48' : ''}; transition:all 0.2s" onclick="likeComment('${postId}', '${c._id}', this)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span class="c-like-count">${c.likes?.length || 0}</span>
              </span>
              <span class="c-action-btn" style="cursor:pointer; display:flex; align-items:center; gap:0.3rem; transition:all 0.2s" onclick="toggleReplyBox('${c._id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                Reply
              </span>
            </div>
            <div id="reply-box-${c._id}" style="display:none; margin-top: 0.5rem; margin-bottom:0.5rem">
              <div class="add-comment" style="margin-top:0">
                <input type="text" placeholder="Write a reply..." id="rinput-${c._id}" onkeydown="if(event.key==='Enter')addReply('${postId}','${c._id}')" style="font-size:0.75rem; padding:0.4rem 0.6rem"/>
                <button class="cb-btn cb-btn-primary cb-btn-sm" style="padding: 0.3rem 0.6rem; font-size: 0.7rem" onclick="addReply('${postId}','${c._id}')">Reply</button>
              </div>
            </div>
            ${replies.length ? `<div class="replies-list" style="margin-top: 0.5rem;">${renderList(replies)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
  return renderList(topLevel);
}

async function likeComment(postId, commentId, btn) {
  try {
    const res = await apiFetch(`/posts/${postId}/comment/${commentId}/like`, { method: 'POST' });
    if (!res) return;
    const data = await res.json();
    btn.querySelector('.c-like-count').textContent = data.likes;
    btn.querySelector('svg').setAttribute('fill', data.liked ? 'currentColor' : 'none');
    btn.style.color = data.liked ? '#e11d48' : '';
    btn.classList.toggle('liked', data.liked);
  } catch (err) {
    console.error(err);
  }
}

function toggleReplyBox(commentId) {
  const box = document.getElementById(`reply-box-${commentId}`);
  if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

async function addReply(postId, parentId) {
  const input = document.getElementById(`rinput-${parentId}`);
  if (!input || !input.value.trim()) return;
  try {
    const res = await apiFetch(`/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ text: input.value.trim(), parentId })
    });
    const updated = await res.json();
    document.getElementById(`clist-${postId}`).innerHTML = buildComments(updated.comments, postId);
  } catch {}
}

function toggleComments(postId) {
  const sec = document.getElementById(`comments-${postId}`);
  sec.classList.toggle('open');
}

async function toggleLike(postId, btn) {
  try {
    const res = await apiFetch(`/posts/${postId}/like`, { method: 'POST' });
    const data = await res.json();
    btn.querySelector('.like-count').textContent = data.likes;
    btn.querySelector('svg').setAttribute('fill', data.liked ? 'currentColor' : 'none');
    btn.classList.toggle('liked', data.liked);
  } catch {}
}

async function addComment(postId) {
  const input = document.getElementById(`cinput-${postId}`);
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  try {
    const res = await apiFetch(`/posts/${postId}/comment`, { method: 'POST', body: JSON.stringify({ text }) });
    const updated = await res.json();
    document.getElementById(`clist-${postId}`).innerHTML = buildComments(updated.comments, postId);
    document.querySelector(`.action-btn:not(.like-btn) span`, document.getElementById(`post-${postId}`));
    const btns = document.getElementById(`post-${postId}`).querySelectorAll('.action-btn');
    btns.forEach(b => { if (b.textContent.includes('Comments')) b.querySelector('span').textContent = `${updated.comments.length} Comments`; });
  } catch {}
}

async function deleteComment(postId, commentId, btn) {
  try {
    await apiFetch(`/posts/${postId}/comment/${commentId}`, { method: 'DELETE' });
    btn.closest('.comment-item').remove();
  } catch {}
}

async function deletePost(postId, btn) {
  if (!confirm('Delete this post?')) return;
  try {
    await apiFetch(`/posts/${postId}`, { method: 'DELETE' });
    document.getElementById(`post-${postId}`)?.remove();
  } catch {}
}

// Shared role badge CSS
const sharedCSS = `
  .role-badge { display: inline-block; padding: 0.2rem 0.65rem; border-radius: 999px; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.3px; }
  .badge-student { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.25); }
  .badge-professor { background: rgba(20,184,166,0.12); color: #2dd4bf; border: 1px solid rgba(20,184,166,0.2); }
  .badge-alumni { background: rgba(251,113,133,0.12); color: #fb7185; border: 1px solid rgba(251,113,133,0.2); }

  .cb-card { background: rgba(12,17,30,0.8); border: 1px solid rgba(245,158,11,0.12); border-radius: 20px; backdrop-filter: blur(20px); padding: 1.5rem; transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s; }
  .cb-card:hover { border-color: rgba(245,158,11,0.28); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.35); }

  .cb-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1.25rem; border-radius: 10px; border: none; font-family: 'Inter',sans-serif; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; text-decoration: none; }
  .cb-btn-primary { background: linear-gradient(135deg,#d97706,#f59e0b); color: #fff; box-shadow: 0 4px 16px rgba(245,158,11,0.35); }
  .cb-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(245,158,11,0.55); }
  .cb-btn-secondary { background: rgba(15,20,35,0.8); border: 1px solid rgba(245,158,11,0.18); color: #a1a1aa; }
  .cb-btn-secondary:hover { color: #fff; border-color: rgba(245,158,11,0.4); background: rgba(245,158,11,0.08); }
  .cb-btn-danger { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.2); color: #f87171; }
  .cb-btn-danger:hover { background: rgba(239,68,68,0.2); }
  .cb-btn-sm { padding: 0.35rem 0.8rem; font-size: 0.78rem; }

  .cb-input { width: 100%; padding: 0.7rem 1rem; background: rgba(15,20,35,0.8); border: 1px solid rgba(245,158,11,0.12); border-radius: 10px; color: #f1f5f9; font-family: 'Inter',sans-serif; font-size: 0.87rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
  .cb-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.12); }
  .cb-input::placeholder { color: #57534e; }
  .cb-textarea { resize: vertical; min-height: 80px; }
  .cb-select { appearance: none; cursor: pointer; }

  .cb-label { display: block; font-size: 0.73rem; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.4rem; }
  .cb-form-group { margin-bottom: 1rem; }

  .page-header { margin-bottom: 1.5rem; }
  .page-header h1 { font-family: 'Space Grotesk',sans-serif; font-size: clamp(1.6rem,3vw,2.2rem); font-weight: 800; color: #fff; letter-spacing: -0.5px; margin-bottom: 0.3rem; background: linear-gradient(135deg,#fbbf24,#14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .page-header p { color: #a1a1aa; font-size: 0.92rem; }

  .alert { padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.82rem; font-weight: 500; margin-bottom: 1rem; }
  .alert-success { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); color: #34d399; }
  .alert-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #f87171; }

  .empty-state { text-align: center; padding: 3rem 2rem; color: #57534e; }
  .empty-state svg { width: 48px; height: 48px; margin: 0 auto 1rem; display: block; opacity: 0.4; }
  .empty-state p { font-size: 0.9rem; }
  .empty-state h3 { font-size: 1.1rem; color: #71717a; margin-bottom: 0.4rem; }

  .spinner { display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(245,158,11,0.25); border-top-color: #f59e0b; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
  .modal { background: rgba(12,17,30,0.98); border: 1px solid rgba(245,158,11,0.18); border-radius: 24px; padding: 2rem; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; backdrop-filter: blur(20px); }
  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
  .modal-title { font-family: 'Space Grotesk',sans-serif; font-size: 1.2rem; font-weight: 700; color: #fff; }
  .modal-close { background: none; border: none; color: #a1a1aa; cursor: pointer; padding: 0.25rem; border-radius: 6px; transition: color 0.2s; }
  .modal-close:hover { color: #fff; }

  /* Post card (Shared for Feed & Profile) */
  .post-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;margin-bottom:1rem;backdrop-filter:blur(20px);transition:border-color 0.25s}
  .post-card:hover{border-color:rgba(245,158,11,0.25)}
  .post-header{display:flex;align-items:center;gap:0.75rem;padding:1rem 1.25rem 0}
  .post-avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid rgba(245,158,11,0.18);cursor:pointer;transition:border-color 0.2s}
  .post-avatar:hover{border-color:rgba(245,158,11,0.45)}
  .post-author-info{flex:1}
  .post-author-name{font-size:0.9rem;font-weight:700;color:#fff;text-decoration:none;display:inline-block}
  .post-author-name:hover{color:#fbbf24}
  .post-meta{font-size:0.72rem;color:var(--dim);margin-top:0.1rem}
  .post-delete{background:none;border:none;color:var(--dim);cursor:pointer;padding:0.3rem;border-radius:6px;transition:color 0.2s}
  .post-delete:hover{color:#f87171}
  .post-body{padding:0.75rem 1.25rem;font-size:0.91rem;line-height:1.65;color:var(--text)}
  .post-image{width:100%;max-height:500px;object-fit:cover;display:block}
  .post-actions{display:flex;align-items:center;gap:1rem;padding:0.75rem 1.25rem;border-top:1px solid rgba(245,158,11,0.06)}
  .action-btn{display:flex;align-items:center;gap:0.4rem;background:none;border:none;color:var(--muted);font-size:0.83rem;cursor:pointer;padding:0.35rem 0.7rem;border-radius:8px;font-family:'Inter',sans-serif;transition:all 0.2s}
  .action-btn:hover{color:#fff;background:rgba(245,158,11,0.08)}
  .action-btn.liked{color:#ef4444}
  .action-btn.liked:hover{color:#f87171}
  .comment-toggle{margin-left:auto}

  /* Comments */
  .comments-section{border-top:1px solid rgba(245,158,11,0.06);padding:0.75rem 1.25rem;display:none}
  .comments-section.open{display:block}
  .comment-item{display:flex;align-items:flex-start;gap:0.65rem;margin-bottom:0.75rem}
  .comment-avatar{width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(245,158,11,0.12)}
  .comment-bubble{background:rgba(15,20,35,0.8);border:1px solid rgba(245,158,11,0.08);border-radius:12px;padding:0.5rem 0.8rem;flex:1}
  .comment-name{font-size:0.78rem;font-weight:700;color:#fff;text-decoration:none;display:inline-block}
  .comment-name:hover{color:#fbbf24}
  .comment-text{font-size:0.82rem;color:var(--muted);margin-top:0.15rem}
  .comment-time{font-size:0.68rem;color:var(--dim);margin-top:0.25rem}
  .comment-del{background:none;border:none;color:var(--dim);cursor:pointer;font-size:0.7rem;padding:0.15rem 0.4rem;border-radius:4px;margin-left:auto;transition:color 0.2s}
  .comment-del:hover{color:#f87171}
  .add-comment{display:flex;gap:0.6rem;margin-top:0.75rem;align-items:center}
  .add-comment input{flex:1;background:rgba(15,20,35,0.8);border:1px solid rgba(245,158,11,0.1);border-radius:10px;padding:0.55rem 0.85rem;color:var(--text);font-family:'Inter',sans-serif;font-size:0.82rem;outline:none}
  .add-comment input:focus{border-color:#f59e0b}

  /* ─── Light Mode Variables & Overrides ─── */
  html.light-mode {
    --bg: #faf9f6;
    --surface: rgba(255, 255, 255, 0.95);
    --border: rgba(245, 158, 11, 0.2);
    --text: #1c1917;
    --muted: #57534e;
    --dim: #78716c;
  }
  html.light-mode .cb-card, html.light-mode .post-card, html.light-mode .create-post, html.light-mode .modal-content, html.light-mode .feat-card, html.light-mode .profile-header {
    background: #ffffff;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  }
  html.light-mode .nav-btn, html.light-mode .action-btn { color: #57534e; }
  html.light-mode .action-btn.liked { color: #dc2626; }
  html.light-mode .post-author-name, html.light-mode .comment-name, html.light-mode .welcome-info h1, html.light-mode .section-title, html.light-mode .notice-title, html.light-mode .lb-name, html.light-mode .mini-post-name, html.light-mode .nav-logo-text, html.light-mode .page-title, html.light-mode .ph-name, html.light-mode .page-header h1, html.light-mode .modal-title { color: #1c1917; -webkit-text-fill-color: #1c1917; }
  html.light-mode input, html.light-mode select, html.light-mode textarea, html.light-mode .nav-search input {
    background: #f5f5f4; color: #1c1917; border-color: rgba(245,158,11,0.2);
  }
  html.light-mode input::placeholder, html.light-mode textarea::placeholder { color: #a8a29e; }
  html.light-mode .comment-bubble, html.light-mode .msg, html.light-mode .chat-main { background: #f5f5f4; }
  html.light-mode .msg-self { background: rgba(245,158,11,0.15); color: #1c1917; }
  html.light-mode .nav-dropdown { background: #ffffff; border-color: rgba(245,158,11,0.15); }
  html.light-mode .nav-dropdown a:hover { background: #fafaf9; color: #1c1917; }
  html.light-mode #cb-nav, html.light-mode nav { background: rgba(255,255,255,0.92); border-bottom-color: rgba(245,158,11,0.18); }
  html.light-mode #cb-nav.scrolled { background: rgba(255,255,255,0.98); }
  html.light-mode .nav-search-box { background: #f5f5f4; border-color: rgba(245,158,11,0.18); }
  html.light-mode .nav-search-box input { color: #1c1917; }
  html.light-mode .nav-search-box input::placeholder { color: #78716c; }
  html.light-mode .search-dropdown { background: rgba(255,255,255,0.96); }
  html.light-mode .search-name { color: #1c1917; }
  html.light-mode .nav-profile-btn, html.light-mode .nav-dm-btn { background: #f5f5f4; border-color: rgba(245,158,11,0.18); color: #1c1917; }
  html.light-mode .nav-profile-btn:hover, html.light-mode .nav-dm-btn:hover { background: #e7e5e4; }
  html.light-mode .blob { opacity: 0.4; }
  html.light-mode .nav-links a { color: #57534e; }
  html.light-mode .nav-links a:hover, html.light-mode .nav-links a.active { color: #1c1917; background: rgba(245,158,11,0.1); }
  html.light-mode .nav-profile-dropdown { background: rgba(255,255,255,0.98); border-color: rgba(245,158,11,0.15); }
  html.light-mode .nav-profile-dropdown a:hover { background: #fafaf9; }
`;
(function() {
  const s = document.createElement('style');
  s.textContent = sharedCSS;
  document.head.appendChild(s);
})();
