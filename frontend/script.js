const sections = [...document.querySelectorAll(".section")];
const navLinks = [...document.querySelectorAll(".nav-links a")];
const chipButtons = [...document.querySelectorAll(".chip")];
const searchInput = document.getElementById("searchInput");
const projectGrid = document.getElementById("projectGrid");
const skeletonGrid = document.getElementById("skeletonGrid");
const topicTitle = document.getElementById("topicTitle");
const topicIntro = document.getElementById("topicIntro");
const topicBody = document.getElementById("topicBody");
const topicUseCase = document.getElementById("topicUseCase");
const projectModal = document.getElementById("projectModal");
const projectModalClose = document.getElementById("projectModalClose");
const projectModalTitle = document.getElementById("projectModalTitle");
const projectModalTag = document.getElementById("projectModalTag");
const projectModalSummary = document.getElementById("projectModalSummary");
const projectModalContent = document.getElementById("projectModalContent");
const toastStack = document.getElementById("toastStack");
const menuToggleButton = document.querySelector(".menu-toggle");
const navWrap = document.querySelector(".nav-links");
const authNavLink = document.getElementById("authNavLink");
const logoutNavBtn = document.getElementById("logoutNavBtn");
const dashboardNavLink = document.getElementById("dashboardNavLink");

function getApiBaseUrl() {
  // If running locally, use localhost. 
  // Otherwise, use your Render Backend URL.
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return isLocal ? "http://localhost:5000" : "https://gyaanuday-1.onrender.com";
}

// Theme Management
function initTheme() {
  const storedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', storedTheme);
  updateThemeIcon(storedTheme);
}

window.toggleTheme = function() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const themeIcons = document.querySelectorAll('.theme-icon');
  themeIcons.forEach(icon => {
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
  });
}

// Initialize theme immediately
initTheme();

let projects = []; // Initialize empty, will fetch from API

let activeFilter = "all";
const topicDescriptions = {
  all: {
    title: "All Projects",
    intro:
      "This view gives you a broad discovery feed across AI, web, IoT, analytics, and multidisciplinary innovations so you can compare ideas quickly without narrowing too early.",
    body:
      "Use this section to identify patterns across teams: problem statements, implementation quality, user focus, and measurable outcomes. It is especially useful during early research when you want to scan multiple approaches before deciding where to invest your time.",
    useCase:
      "Best for first-time exploration, hackathon inspiration, and finding cross-domain concepts that can be merged into stronger projects.",
  },
  ai: {
    title: "Artificial Intelligence",
    intro:
      "AI projects in this section focus on machine learning, NLP, computer vision, and predictive systems that learn from data and improve decision-making.",
    body:
      "Typical submissions include resume ranking engines, recommendation pipelines, image classifiers, and smart assistants. A strong AI project clearly explains data sources, model architecture, training strategy, evaluation metrics, and how the model performs in real-world conditions.",
    useCase:
      "Use this category when you are looking for automated intelligence, advanced analytics, and systems that reduce manual effort through learning-based behavior.",
  },
  web: {
    title: "Web Development",
    intro:
      "Web projects highlight modern frontend and backend engineering for interactive platforms, dashboards, and collaboration experiences.",
    body:
      "High-quality web entries usually demonstrate responsive design, API integration, clean state management, accessibility, and security practices. You can evaluate architecture choices such as component structure, routing strategy, performance optimization, and scalability of the overall application.",
    useCase:
      "Use this category when you want deployable products for browsers, user portals, admin systems, and teamwork-focused digital tools.",
  },
  iot: {
    title: "Internet of Things",
    intro:
      "IoT projects combine hardware devices, sensors, network communication, and software dashboards to monitor and control physical systems.",
    body:
      "Common examples include smart irrigation, energy monitoring, environmental sensing, and automated campus solutions. The strongest IoT implementations provide stable sensor calibration, low-latency data flow, reliable alerts, and practical deployment details such as power usage, connectivity, and maintenance strategy.",
    useCase:
      "Use this category when your goal is real-world automation, remote control, and data-driven operations for physical infrastructure.",
  },
  popular: {
    title: "Popularity and Community Impact",
    intro:
      "This view surfaces projects that are attracting strong community attention through higher likes, views, and engagement behavior.",
    body:
      "Popularity often indicates clear communication, practical relevance, and polished execution. Reviewing these projects helps you understand what resonates with users: strong demos, concise problem framing, visible outcomes, and thoughtful documentation that makes ideas easy to adopt and extend.",
    useCase:
      "Use this category to benchmark project presentation quality, identify trending themes, and model your own submission for higher visibility.",
  },
};



let currentOpenProjectId = null;

function renderComments(comments) {
  const commentsList = document.getElementById("commentsList");
  if (!commentsList) return;
  if (!comments || comments.length === 0) {
    commentsList.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No comments yet. Be the first!</p>';
    return;
  }

  const currentUser = getCurrentUser();
  const isAdmin = currentUser && currentUser.role === "admin";

  commentsList.innerHTML = comments.map(c => `
    <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; position: relative;">
      <strong style="color: #a5b4fc; font-size: 0.85rem;">${c.user?.name || 'Unknown User'}</strong>
      <p style="margin: 4px 0 0; font-size: 0.9rem; color: #e2e8f0;">${c.text}</p>
      <small style="color: #64748b; font-size: 0.75rem;">${new Date(c.createdAt).toLocaleDateString()}</small>
      ${isAdmin ? `<button onclick="deleteComment('${c._id}')" class="btn btn-danger" style="position: absolute; top: 10px; right: 10px; padding: 4px 8px; font-size: 0.75rem; background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2);">Delete</button>` : ''}
    </div>
  `).join('');
}

async function deleteComment(commentId) {
  if (!confirm("Are you sure you want to delete this comment?")) return;
  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/projects/${currentOpenProjectId}/comment/${commentId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    if (res.ok && result.success) {
      fetchProjectDetails(currentOpenProjectId); // refresh comments
    } else {
      notify(result.message || "Failed to delete comment");
    }
  } catch (err) {
    notify("Network error");
  }
}

function openProjectModal(project) {
  if (!projectModal || !projectModalTitle || !projectModalSummary || !projectModalContent || !projectModalTag) {
    return;
  }

  // Use real user input from the project object
  projectModalTag.textContent = project.domain || "General";
  projectModalTitle.textContent = project.title;
  projectModalSummary.textContent = (project.tags || []).join(" • ");

  // Format description into paragraphs
  const descriptionHtml = (project.description || "No description provided.")
    .split("\n")
    .filter(p => p.trim())
    .map(p => `<p>${p}</p>`)
    .join("");

  projectModalContent.innerHTML = descriptionHtml;

  const downloadBtn = document.getElementById("projectModalDownload");
  if (downloadBtn) {
    if (project.fileUrl) {
      downloadBtn.href = `${getApiBaseUrl()}${project.fileUrl}`;
      downloadBtn.style.display = "inline-flex";
    } else {
      downloadBtn.style.display = "none";
    }
  }

  currentOpenProjectId = project._id;

  // Render votes
  const upvoteCount = document.getElementById("upvoteCount");
  const downvoteCount = document.getElementById("downvoteCount");
  if (upvoteCount) upvoteCount.textContent = project.upvotes?.length || 0;
  if (downvoteCount) downvoteCount.textContent = project.downvotes?.length || 0;

  // Render comments
  renderComments(project.comments);

  // Handle Admin Project Deletion Button
  const currentUser = getCurrentUser();
  const isAdmin = currentUser && currentUser.role === "admin";
  let adminDeleteBtn = document.getElementById("adminDeleteProjectBtn");

  if (isAdmin) {
    if (!adminDeleteBtn) {
      adminDeleteBtn = document.createElement("button");
      adminDeleteBtn.id = "adminDeleteProjectBtn";
      adminDeleteBtn.className = "btn btn-danger";
      adminDeleteBtn.style = "display: inline-flex; align-items: center; gap: 8px; background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2);";
      adminDeleteBtn.innerHTML = "<span>🗑️</span> Delete Project";
      adminDeleteBtn.onclick = async () => {
        if (!confirm("Are you sure you want to permanently delete this project? This action cannot be undone.")) return;
        const token = localStorage.getItem("authToken");
        try {
          const res = await fetch(`${getApiBaseUrl()}/api/projects/${currentOpenProjectId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            notify("Project deleted successfully");
            closeProjectModal();
            loadProjects(); // refresh explore grid
          } else {
            notify("Failed to delete project");
          }
        } catch (err) {
          notify("Network error");
        }
      };
      // Append it next to the download button
      const modalActions = document.querySelector(".modal-actions");
      if (modalActions) modalActions.appendChild(adminDeleteBtn);
    }
    adminDeleteBtn.style.display = "inline-flex";
  } else if (adminDeleteBtn) {
    adminDeleteBtn.style.display = "none";
  }

  projectModal.classList.remove("hidden");
  projectModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeProjectModal() {
  if (!projectModal) return;
  projectModal.classList.add("hidden");
  projectModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function updateTopicDetails(filterKey) {
  const details = topicDescriptions[filterKey] || topicDescriptions.all;
  if (!topicTitle || !topicIntro || !topicBody || !topicUseCase) return;
  topicTitle.textContent = details.title;
  topicIntro.textContent = details.intro;
  topicBody.textContent = details.body;
  topicUseCase.textContent = details.useCase;
}

function redirectToDashboard() {
  const user = getCurrentUser();
  if (!user) {
    notify("Please login to access your dashboard.");
    window.location.hash = "#auth";
    return;
  }
  if (user.role === "admin") {
    window.location.href = "admin-dashboard.html";
  } else {
    window.location.href = "user-dashboard.html";
  }
}

function showSectionByHash() {
  const hash = window.location.hash || "#landing";
  const requestedId = hash.replace("#", "");

  if (requestedId === "dashboard") {
    redirectToDashboard();
    return;
  }

  // Handle redirects if on index.html and trying to reach auth/upload
  if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
    if (requestedId === "auth") {
      window.location.href = "auth.html";
      return;
    }
    if (requestedId === "upload") {
      redirectToDashboard(); // In the new flow, upload is inside the dashboard
      return;
    }
  }

  const targetSection = document.getElementById(requestedId);
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: "smooth" });
  }

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${requestedId}`);
  });

  if (navWrap) navWrap.classList.remove("open");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function renderProjects(list) {
  if (!projectGrid) return;
  projectGrid.innerHTML = "";

  if (!list.length) {
    projectGrid.innerHTML =
      '<article class="project-card"><h3>No projects found</h3><p>Try another keyword or filter.</p></article>';
    return;
  }

  list.forEach((project) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "project-card project-card-button";
    card.setAttribute("aria-label", `Open details for ${project.title}`);
    
    const authorName = project.user ? project.user.name : 'Unknown Author';
    const authorId = project.user ? project.user._id : null;

    card.innerHTML = `
      <h3>${project.title}</h3>
      ${authorId ? `<div class="project-author" style="margin-bottom: 10px; font-size: 0.85rem; color: #a5b4fc; cursor: pointer;" onclick="event.stopPropagation(); openPublicProfile('${authorId}')">By <span style="text-decoration: underline;">${authorName}</span></div>` : ''}
      <div class="tags">${(project.tags || []).map((tag) => `<span>${tag}</span>`).join("")}</div>
      <p>${project.description ? (project.description.length > 100 ? project.description.substring(0, 100) + '...' : project.description) : "No description provided."}</p>
    `;
    card.addEventListener("click", () => {
      openProjectModal(project);
    });
    projectGrid.appendChild(card);
  });
}
function injectPublicProfileModal() {
  if (document.getElementById("publicProfileModal")) return;
  const modalHtml = `
    <div id="publicProfileModal" class="project-modal hidden" aria-hidden="true">
      <div class="project-modal-backdrop" onclick="closePublicProfileModal()"></div>
      <article class="project-modal-card glass" role="dialog" aria-modal="true" style="max-width: 500px; padding: 2.5rem;">
        <button type="button" class="project-modal-close" onclick="closePublicProfileModal()" aria-label="Close profile">×</button>
        
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="width: 120px; height: 120px; border-radius: 50%; margin: 0 auto 1.5rem auto; background: rgba(99,102,241,0.2); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 3rem; border: 3px solid rgba(99,102,241,0.3);">
            <img id="publicProfileImg" src="" style="width: 100%; height: 100%; object-fit: cover; display: none;">
            <span id="publicProfileInitials">👤</span>
          </div>
          <h2 id="publicProfileName" style="font-size: 2rem; margin-bottom: 0.5rem; color: var(--text-primary);"></h2>
          <p id="publicProfileEmail" style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 1rem;"></p>
          <div style="display: flex; justify-content: center; gap: 1rem; margin-bottom: 1.5rem;">
            <div style="text-align: center;">
              <div id="publicProfileProjectCount" style="font-size: 1.5rem; font-weight: bold; color: #a5b4fc;">0</div>
              <div style="font-size: 0.75rem; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em;">Projects</div>
            </div>
            <div style="text-align: center;">
              <div id="publicProfileFriendsCount" style="font-size: 1.5rem; font-weight: bold; color: #a5b4fc;">0</div>
              <div style="font-size: 0.75rem; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em;">Friends</div>
            </div>
          </div>
          <p id="publicProfileBio" style="color: #cbd5e1; font-size: 1rem; line-height: 1.6; max-width: 400px; margin: 0 auto;"></p>
        </div>

        <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 2rem;">
          <button id="publicProfileAddFriendBtn" class="btn btn-primary" style="padding: 10px 24px; font-size: 1rem;">Add Friend</button>
          <button id="publicProfileMessageBtn" class="btn btn-secondary" style="padding: 10px 24px; font-size: 1rem; border-radius: 10px;">Message</button>
        </div>
      </article>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function injectChatModal() {
  if (document.getElementById("chatModal")) return;
  const modalHtml = `
    <div id="chatModal" class="project-modal hidden" aria-hidden="true" style="z-index: 10000;">
      <div class="project-modal-backdrop" onclick="closeChatModal()"></div>
      <article class="project-modal-card glass" role="dialog" aria-modal="true" style="max-width: 450px; padding: 0; display: flex; flex-direction: column; height: 600px; max-height: 90vh;">
        
        <div style="padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); border-radius: 20px 20px 0 0;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(99,102,241,0.2); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
              <img id="chatUserImg" src="" style="width: 100%; height: 100%; object-fit: cover; display: none;">
              <span id="chatUserInitials">👤</span>
            </div>
            <h3 id="chatUserName" style="margin: 0; font-size: 1.2rem; color: var(--text-primary);">User Name</h3>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="position: relative;">
              <button type="button" class="btn" id="chatOptionsBtn" onclick="toggleChatOptionsMenu()" style="background: transparent; border: none; font-size: 1.2rem; color: var(--text-primary); cursor: pointer; padding: 0 5px;">⋮</button>
              <div id="chatOptionsMenu" class="hidden" style="position: absolute; right: 0; top: 100%; background: #1e1e2f; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 0; min-width: 150px; z-index: 10001; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                <button type="button" id="chatMenuFriendBtn" onclick="toggleFriendFromChat()" style="width: 100%; text-align: left; background: transparent; border: none; padding: 8px 16px; color: var(--text-primary); cursor: pointer; font-size: 0.9rem;">Add Friend</button>
                <button type="button" id="chatMenuBlockBtn" onclick="toggleBlockUser()" style="width: 100%; text-align: left; background: transparent; border: none; padding: 8px 16px; color: #ef4444; cursor: pointer; font-size: 0.9rem;">Block User</button>
              </div>
            </div>
            <button type="button" class="project-modal-close" onclick="closeChatModal()" aria-label="Close chat" style="position: static; margin: 0; width: 36px; height: 36px;">×</button>
          </div>
        </div>
        
        <div id="chatMessages" style="flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 10px;">
          <!-- Messages go here -->
        </div>

        <form id="chatForm" style="padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 10px; background: rgba(0,0,0,0.2); border-radius: 0 0 20px 20px;">
          <input type="text" id="chatInput" placeholder="Type a message..." required style="flex: 1; padding: 12px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: var(--text-primary);">
          <button type="submit" id="chatSendBtn" class="btn btn-primary" style="padding: 10px 20px; border-radius: 10px;">Send</button>
        </form>
      </article>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById("chatForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("chatInput");
    if (input.disabled) return;
    const text = input.value.trim();
    if (!text || !window.currentChatUserId) return;

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${getApiBaseUrl()}/api/messages/${window.currentChatUserId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const result = await res.json();
      if (res.ok) {
        input.value = "";
        openChatModal(window.currentChatUserId); // Refresh
      } else {
        notify(result.message || "Failed to send message");
      }
    } catch (err) {
      notify("Network error");
    }
  });
}

window.toggleChatOptionsMenu = function() {
  const menu = document.getElementById("chatOptionsMenu");
  if (menu) menu.classList.toggle("hidden");
}

// Close menu when clicking outside
document.addEventListener("click", function(e) {
  const menu = document.getElementById("chatOptionsMenu");
  const btn = document.getElementById("chatOptionsBtn");
  if (menu && btn && !menu.classList.contains("hidden") && !menu.contains(e.target) && e.target !== btn) {
    menu.classList.add("hidden");
  }
});

window.closeChatModal = function() {
  const modal = document.getElementById("chatModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    window.currentChatUserId = null;
    if (window.chatPollInterval) {
      clearInterval(window.chatPollInterval);
      window.chatPollInterval = null;
    }
  }
}

window.openChatModal = async function(userId) {
  const user = requireAuth();
  if (!user) return;
  
  injectChatModal();
  window.currentChatUserId = userId;
  const modal = document.getElementById("chatModal");
  if (!modal) return;
  
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const messagesContainer = document.getElementById("chatMessages");
  const nameEl = document.getElementById("chatUserName");
  const imgEl = document.getElementById("chatUserImg");
  const initEl = document.getElementById("chatUserInitials");
  
  if (!window.chatPollInterval) {
    window.chatPollInterval = setInterval(() => {
      if (window.currentChatUserId && !modal.classList.contains("hidden")) {
        fetchChatHistory(window.currentChatUserId, false);
      }
    }, 5000); // poll every 5 seconds
  }

  await fetchChatHistory(userId, true);
  
  // Also refresh global notifications as reading a message drops the unread count
  checkNotifications();
}

async function fetchChatHistory(userId, scrollToBottom) {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${getApiBaseUrl()}/api/messages/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    if (res.ok && result.success) {
      const otherUser = result.data.otherUser;
      const messages = result.data.messages;
      const isFriend = result.data.isFriend;
      const isBlocked = result.data.isBlocked;
      const hasBlocked = result.data.hasBlocked;

      // Store these globally to avoid re-fetching when buttons are clicked
      window.currentChatIsFriend = isFriend;
      window.currentChatHasBlocked = hasBlocked;

      const nameEl = document.getElementById("chatUserName");
      const imgEl = document.getElementById("chatUserImg");
      const initEl = document.getElementById("chatUserInitials");
      
      const friendBtn = document.getElementById("chatMenuFriendBtn");
      const blockBtn = document.getElementById("chatMenuBlockBtn");
      const inputEl = document.getElementById("chatInput");
      const sendBtn = document.getElementById("chatSendBtn");

      if (nameEl) nameEl.textContent = otherUser.name;
      if (otherUser.profilePicture && imgEl && initEl) {
        imgEl.src = `${getApiBaseUrl()}${otherUser.profilePicture}`;
        imgEl.style.display = "block";
        initEl.style.display = "none";
      }

      if (friendBtn) {
        friendBtn.textContent = isFriend ? "Remove Friend" : "Add Friend";
        // Hide friend button if blocked
        friendBtn.style.display = isBlocked ? "none" : "block";
      }
      
      if (blockBtn) {
        blockBtn.textContent = hasBlocked ? "Unblock User" : "Block User";
      }

      if (inputEl && sendBtn) {
        if (isBlocked) {
          inputEl.disabled = true;
          inputEl.placeholder = "You cannot message this user.";
          sendBtn.disabled = true;
        } else {
          inputEl.disabled = false;
          inputEl.placeholder = "Type a message...";
          sendBtn.disabled = false;
        }
      }

      const messagesContainer = document.getElementById("chatMessages");
      if (!messagesContainer) return;
      
      const currentUser = getCurrentUser();
      
      if (messages.length === 0) {
        messagesContainer.innerHTML = `<div style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">No messages yet. Say hi!</div>`;
      } else {
        messagesContainer.innerHTML = messages.map(msg => {
          const isMine = msg.sender === currentUser._id || msg.sender === currentUser.id;
          return `
            <div style="display: flex; flex-direction: column; align-items: ${isMine ? 'flex-end' : 'flex-start'};">
              <div style="max-width: 80%; padding: 10px 14px; border-radius: 14px; ${isMine ? 'background: rgba(99,102,241,0.9); color: white; border-bottom-right-radius: 4px;' : 'background: rgba(255,255,255,0.1); color: #e2e8f0; border-bottom-left-radius: 4px;'}">
                ${msg.text}
              </div>
              <div style="font-size: 0.7rem; color: #64748b; margin-top: 4px;">
                ${new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          `;
        }).join("");
      }
      
      if (scrollToBottom) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  } catch (err) {
    console.error("Failed to fetch chat", err);
  }
}

async function openPublicProfile(userId) {
  injectPublicProfileModal();
  const modal = document.getElementById("publicProfileModal");
  if (!modal) return;
  
  // Show modal with loading state
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const nameEl = document.getElementById("publicProfileName");
  const emailEl = document.getElementById("publicProfileEmail");
  const bioEl = document.getElementById("publicProfileBio");
  const projCountEl = document.getElementById("publicProfileProjectCount");
  const friendCountEl = document.getElementById("publicProfileFriendsCount");
  const imgEl = document.getElementById("publicProfileImg");
  const initEl = document.getElementById("publicProfileInitials");
  const addFriendBtn = document.getElementById("publicProfileAddFriendBtn");

  if(nameEl) nameEl.textContent = "Loading...";
  if(emailEl) emailEl.textContent = "";
  if(bioEl) bioEl.textContent = "";

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/users/public/${userId}`);
    const result = await res.json();
    
    if (res.ok && result.success) {
      const u = result.data;
      if(nameEl) nameEl.textContent = u.name;
      if(emailEl) emailEl.textContent = u.email;
      if(bioEl) bioEl.textContent = u.bio || "This user hasn't written a bio yet.";
      if(projCountEl) projCountEl.textContent = u.projectCount || 0;
      if(friendCountEl) friendCountEl.textContent = u.friendsCount || 0;
      
      if (u.profilePicture && imgEl && initEl) {
        imgEl.src = `${getApiBaseUrl()}${u.profilePicture}`;
        imgEl.style.display = "block";
        initEl.style.display = "none";
      } else if (imgEl && initEl) {
        imgEl.style.display = "none";
        initEl.style.display = "block";
      }

      if(addFriendBtn) {
        addFriendBtn.onclick = () => {
          if (typeof sendFriendRequest === "function") {
            sendFriendRequest(u._id);
          } else {
            notify("Please login from your dashboard to add friends.");
          }
        };
      }
      
      const msgBtn = document.getElementById("publicProfileMessageBtn");
      if (msgBtn) {
        msgBtn.onclick = () => {
          closePublicProfileModal();
          openChatModal(u._id);
        };
      }
    } else {
      notify("Could not load user profile");
      closePublicProfileModal();
    }
  } catch (err) {
    notify("Network error loading profile");
    closePublicProfileModal();
  }
}

window.closePublicProfileModal = function() {
  const modal = document.getElementById("publicProfileModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function applyProjectFilters() {
  if (!searchInput) return;
  const query = searchInput.value.toLowerCase().trim();
  let filtered = projects;

  if (activeFilter !== "all" && activeFilter !== "popular") {
    filtered = filtered.filter(p => 
      (p.domain && p.domain.toLowerCase() === activeFilter) || 
      (p.tags && p.tags.map(t => t.toLowerCase()).includes(activeFilter))
    );
  }

  if (query) {
    filtered = filtered.filter((project) => {
      const haystack = `${project.title} ${project.description || ''} ${(project.tags || []).join(" ")}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  if (activeFilter === "popular") {
    filtered = [...filtered].sort((a, b) => {
      const aScore = (a.upvotes || []).length + (a.likes || 0);
      const bScore = (b.upvotes || []).length + (b.likes || 0);
      return bScore - aScore;
    });
  }

  renderProjects(filtered);
}

function notify(message) {
  if (!toastStack) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastStack.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2800);
}

function updateAuthNavUI() {
  if (!authNavLink || !logoutNavBtn) return;
  const storedUser = localStorage.getItem("authUser");
  if (!storedUser) {
    authNavLink.textContent = "Login";
    authNavLink.setAttribute("href", "auth.html");
    logoutNavBtn.classList.add("hidden");
    return;
  }
  try {
    const user = JSON.parse(storedUser);
    const displayName = user?.name?.trim() || "User";
    authNavLink.textContent = displayName;
    authNavLink.setAttribute("href", "#");
    authNavLink.onclick = (e) => {
      e.preventDefault();
      redirectToDashboard();
    };
    logoutNavBtn.classList.remove("hidden");

    // Add Inbox button if not present
    let inboxBtn = document.getElementById("navInboxBtn");
    if (!inboxBtn) {
      inboxBtn = document.createElement("button");
      inboxBtn.id = "navInboxBtn";
      inboxBtn.type = "button";
      inboxBtn.className = "btn";
      inboxBtn.style.background = "transparent";
      inboxBtn.style.border = "none";
      inboxBtn.style.color = "var(--text-secondary)";
      inboxBtn.style.fontSize = "1.2rem";
      inboxBtn.style.cursor = "pointer";
      inboxBtn.style.position = "relative";
      inboxBtn.style.padding = "0 8px";
      inboxBtn.innerHTML = `💬<span id="navInboxDot" style="display:none; position:absolute; top:2px; right:4px; width:8px; height:8px; background:#ef4444; border-radius:50%; box-shadow: 0 0 5px rgba(239,68,68,0.8);"></span>`;
      
      inboxBtn.onclick = () => {
        openInboxModal();
      };

      authNavLink.parentElement.insertBefore(inboxBtn, authNavLink);
    }

    // Add notification bell if not present
    let notifBtn = document.getElementById("navNotificationBtn");
    if (!notifBtn) {
      notifBtn = document.createElement("button");
      notifBtn.id = "navNotificationBtn";
      notifBtn.type = "button";
      notifBtn.className = "btn";
      notifBtn.style.background = "transparent";
      notifBtn.style.border = "none";
      notifBtn.style.color = "var(--text-secondary)";
      notifBtn.style.fontSize = "1.2rem";
      notifBtn.style.cursor = "pointer";
      notifBtn.style.position = "relative";
      notifBtn.style.padding = "0 8px";
      notifBtn.innerHTML = `🔔<span id="navNotificationDot" style="display:none; position:absolute; top:2px; right:4px; width:8px; height:8px; background:#ef4444; border-radius:50%; box-shadow: 0 0 5px rgba(239,68,68,0.8);"></span>`;
      
      notifBtn.onclick = () => {
        openNotificationModal();
      };

      authNavLink.parentElement.insertBefore(notifBtn, authNavLink);
    }
    
    // Check for notifications
    checkNotifications();
  } catch (error) {
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
    authNavLink.textContent = "Login";
    authNavLink.setAttribute("href", "auth.html");
    logoutNavBtn.classList.add("hidden");
  }
}

async function checkNotifications() {
  const token = localStorage.getItem("authToken");
  if (!token) return;
  try {
    const [notifRes, msgsRes] = await Promise.all([
      fetch(`${getApiBaseUrl()}/api/notifications`, { headers: { "Authorization": `Bearer ${token}` } }),
      fetch(`${getApiBaseUrl()}/api/messages/unread`, { headers: { "Authorization": `Bearer ${token}` } })
    ]);

    let hasUnreadNotifs = false;
    let hasUnreadMsgs = false;

    if (notifRes.ok) {
      const notifResult = await notifRes.json();
      if (notifResult.success && notifResult.unreadCount > 0) {
        hasUnreadNotifs = true;
      }
    }

    if (msgsRes.ok) {
      const msgsResult = await msgsRes.json();
      if (msgsResult.success && msgsResult.count > 0) {
        hasUnreadMsgs = true;
      }
    }

    const bellDot = document.getElementById("navNotificationDot");
    if (bellDot) {
      bellDot.style.display = hasUnreadNotifs ? "block" : "none";
    }

    const inboxDot = document.getElementById("navInboxDot");
    if (inboxDot) {
      inboxDot.style.display = hasUnreadMsgs ? "block" : "none";
    }
  } catch (e) {
    console.error("Failed to check notifications", e);
  }
}

function injectInboxModal() {
  if (document.getElementById("inboxModal")) return;
  const modalHtml = `
    <div id="inboxModal" class="project-modal hidden" aria-hidden="true" style="z-index: 9999;">
      <div class="project-modal-backdrop" onclick="closeInboxModal()"></div>
      <article class="project-modal-card glass" role="dialog" aria-modal="true" style="max-width: 450px; padding: 0; display: flex; flex-direction: column; height: 600px; max-height: 90vh;">
        
        <div style="padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); border-radius: 20px 20px 0 0;">
          <h3 style="margin: 0; font-size: 1.2rem; color: var(--text-primary);">Direct Messages</h3>
          <button type="button" class="project-modal-close" onclick="closeInboxModal()" aria-label="Close inbox" style="position: static; margin: 0; width: 36px; height: 36px;">×</button>
        </div>
        
        <ul id="inboxList" style="flex: 1; overflow-y: auto; padding: 1rem; margin: 0; list-style: none; display: flex; flex-direction: column; gap: 8px;">
          <!-- Conversations go here -->
          <li style="text-align: center; color: var(--text-secondary); padding: 2rem;">Loading conversations...</li>
        </ul>
      </article>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.closeInboxModal = function() {
  const modal = document.getElementById("inboxModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
}

window.openInboxModal = async function() {
  const user = requireAuth();
  if (!user) return;
  
  injectInboxModal();
  const modal = document.getElementById("inboxModal");
  if (!modal) return;
  
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const list = document.getElementById("inboxList");
  
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${getApiBaseUrl()}/api/messages/conversations`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    
    if (res.ok && result.success) {
      if (!result.data || result.data.length === 0) {
        list.innerHTML = `<li style="text-align: center; color: var(--text-secondary); padding: 2rem;">You haven't started any conversations yet.</li>`;
        return;
      }
      
      list.innerHTML = result.data.map(convo => {
        const u = convo.otherUser;
        const isUnread = convo.unreadCount > 0;
        return `
          <li style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border-radius: 12px; background: ${isUnread ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)'}; cursor: pointer; transition: background 0.2s ease;" onclick="closeInboxModal(); openChatModal('${u._id}')">
            <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(99,102,241,0.2); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0;">
                ${u.profilePicture ? `<img src="${getApiBaseUrl()}${u.profilePicture}" style="width: 100%; height: 100%; object-fit: cover;">` : '👤'}
              </div>
              <div style="overflow: hidden;">
                <div style="font-size: 1rem; font-weight: ${isUnread ? '700' : '500'}; color: var(--text-primary);">${u.name}</div>
                <div style="font-size: 0.85rem; color: ${isUnread ? '#fff' : '#94a3b8'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;">
                  ${convo.latestMessage}
                </div>
              </div>
            </div>
            ${isUnread ? `<div style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444; flex-shrink: 0;"></div>` : ''}
          </li>
        `;
      }).join("");
    } else {
      list.innerHTML = `<li style="text-align: center; color: #ef4444; padding: 2rem;">Failed to load conversations.</li>`;
    }
  } catch (err) {
    list.innerHTML = `<li style="text-align: center; color: #ef4444; padding: 2rem;">Network error.</li>`;
  }
}

function injectNotificationModal() {
  if (document.getElementById("notificationModal")) return;
  const modalHtml = `
    <div id="notificationModal" class="project-modal hidden" aria-hidden="true" style="z-index: 9999;">
      <div class="project-modal-backdrop" onclick="closeNotificationModal()"></div>
      <article class="project-modal-card glass" role="dialog" aria-modal="true" style="max-width: 450px; padding: 0; display: flex; flex-direction: column; height: 600px; max-height: 90vh;">
        
        <div style="padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); border-radius: 20px 20px 0 0;">
          <h3 style="margin: 0; font-size: 1.2rem; color: var(--text-primary);">Notifications</h3>
          <button type="button" class="project-modal-close" onclick="closeNotificationModal()" aria-label="Close notifications" style="position: static; margin: 0; width: 36px; height: 36px;">×</button>
        </div>
        
        <ul id="notificationList" style="flex: 1; overflow-y: auto; padding: 1rem; margin: 0; list-style: none; display: flex; flex-direction: column; gap: 8px;">
          <!-- Notifications go here -->
          <li style="text-align: center; color: var(--text-secondary); padding: 2rem;">Loading notifications...</li>
        </ul>
      </article>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.closeNotificationModal = function() {
  const modal = document.getElementById("notificationModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
}

window.openNotificationModal = async function() {
  const user = requireAuth();
  if (!user) return;
  
  injectNotificationModal();
  const modal = document.getElementById("notificationModal");
  if (!modal) return;
  
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const list = document.getElementById("notificationList");
  list.innerHTML = `<li style="text-align: center; color: var(--text-secondary); padding: 2rem;">Loading notifications...</li>`;
  
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${getApiBaseUrl()}/api/notifications`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    
    if (res.ok && result.success) {
      const notifs = result.data || [];
      if (notifs.length === 0) {
        list.innerHTML = `<li style="text-align: center; color: var(--text-secondary); padding: 2rem;">You have no new notifications.</li>`;
        return;
      }
      
      list.innerHTML = notifs.map(n => {
        const u = n.sender;
        let contentHtml = "";
        
        if (n.type === "friend_request") {
          contentHtml = `
            <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary);">${u.name}</div>
            <div style="font-size: 0.8rem; color: #94a3b8;">Sent you a friend request</div>
          `;
        } else if (n.type === "like") {
          contentHtml = `
            <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary);">${u.name}</div>
            <div style="font-size: 0.8rem; color: #94a3b8;">Liked your project: <span style="color: #6366f1;">${n.project ? n.project.title : 'Deleted Project'}</span></div>
          `;
        } else if (n.type === "comment") {
          contentHtml = `
            <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary);">${u.name}</div>
            <div style="font-size: 0.8rem; color: #94a3b8;">Commented on your project: <span style="color: #6366f1;">${n.project ? n.project.title : 'Deleted Project'}</span></div>
          `;
        }

        const bgColor = n.isRead === false ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)";
        const borderColor = n.isRead === false ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)";
        
        let actionButtons = "";
        if (n.type === "friend_request") {
          actionButtons = `
            <div style="display: flex; gap: 8px; margin-top: 10px;">
              <button class="btn btn-primary" onclick="acceptFriendRequestFromModal('${u._id}')" style="flex: 1; padding: 8px; font-size: 0.85rem;">Accept</button>
              <button class="btn btn-secondary" onclick="rejectFriendRequestFromModal('${u._id}')" style="flex: 1; padding: 8px; font-size: 0.85rem;">Decline</button>
            </div>
          `;
        }

        return `
          <li style="display: flex; flex-direction: column; padding: 16px; border-radius: 12px; background: ${bgColor}; border: 1px solid ${borderColor};">
            <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="closeNotificationModal(); openPublicProfile('${u._id}')">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(99,102,241,0.2); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">
                ${u.profilePicture ? `<img src="${getApiBaseUrl()}${u.profilePicture}" style="width: 100%; height: 100%; object-fit: cover;">` : '👤'}
              </div>
              <div>
                ${contentHtml}
              </div>
            </div>
            ${actionButtons}
          </li>
        `;
      }).join("");

      // Mark as read immediately
      fetch(`${getApiBaseUrl()}/api/notifications/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      }).then(() => checkNotifications());

    } else {
      list.innerHTML = `<li style="text-align: center; color: #ef4444; padding: 2rem;">Failed to load notifications.</li>`;
    }
  } catch (err) {
    list.innerHTML = `<li style="text-align: center; color: #ef4444; padding: 2rem;">Network error.</li>`;
  }
}

window.acceptFriendRequestFromModal = async function(userId) {
  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/users/friends/accept/${userId}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    if (res.ok && result.success) {
      notify("Friend request accepted!");
      checkNotifications();
      openNotificationModal(); // Refresh list
      
      // Update dashboard if we are on it
      if (typeof loadFriendsData === "function") {
        loadFriendsData();
      }
    } else {
      notify(result.message || "Failed to accept");
    }
  } catch (err) {
    notify("Network error");
  }
}

window.rejectFriendRequestFromModal = async function(userId) {
  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/users/friends/reject/${userId}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    if (res.ok && result.success) {
      notify("Friend request rejected");
      checkNotifications();
      openNotificationModal(); // Refresh list
      
      // Update dashboard if we are on it
      if (typeof loadFriendsData === "function") {
        loadFriendsData();
      }
    } else {
      notify(result.message || "Failed to reject");
    }
  } catch (err) {
    notify("Network error");
  }
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("authUser") || "null");
  } catch (error) {
    return null;
  }
}

function requireAuth(message = "Please login to continue.") {
  const user = getCurrentUser();
  if (user) return user;
  notify(message);
  window.location.href = "auth.html";
  return null;
}

function setAuthSession(user, token) {
  if (!user) return;
  const resolvedToken = token || `local-${Date.now()}`;
  localStorage.setItem("authToken", resolvedToken);
  localStorage.setItem("authUser", JSON.stringify(user));
}

async function setupExplore() {
  if (!skeletonGrid || !projectGrid) return;

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/projects?limit=50`);
    const result = await res.json();
    if (result.success) {
      projects = result.data.items;
    }
  } catch (error) {
    console.error("Failed to fetch explore projects", error);
  }

  setTimeout(() => {
    skeletonGrid.classList.add("hidden");
    projectGrid.classList.remove("hidden");
    renderProjects(projects);
  }, 1200);

  updateTopicDetails(activeFilter);

  chipButtons.forEach((chip) => {
    chip.addEventListener("click", () => {
      chipButtons.forEach((item) => item.classList.remove("active"));
      chip.classList.add("active");
      activeFilter = chip.dataset.filter;
      updateTopicDetails(activeFilter);
      applyProjectFilters();
    });
  });

  searchInput.addEventListener("input", applyProjectFilters);

  if (projectModalClose) {
    projectModalClose.addEventListener("click", closeProjectModal);
  }
  if (projectModal) {
    projectModal.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
        closeProjectModal();
      }
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProjectModal();
  });
}

function setupUploadForm() {
  const form = document.getElementById("uploadForm");
  if (!form) return;
  const submitBtn = document.getElementById("submitBtn");
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const fileList = document.getElementById("fileList");
  if (!submitBtn || !dropZone || !fileInput || !fileList) return;

  dropZone.addEventListener("click", () => fileInput.click());
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("dragover");
    });
  });
  dropZone.addEventListener("drop", (event) => {
    const files = [...event.dataTransfer.files];
    fileList.textContent = files.map((file) => file.name).join(", ");
  });
  fileInput.addEventListener("change", () => {
    const files = [...fileInput.files];
    fileList.textContent = files.map((file) => file.name).join(", ");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const user = requireAuth("Please login before uploading a project.");
    if (!user) return;

    // Simple validation
    const title = document.getElementById("projectTitle").value.trim();
    const domain = document.getElementById("projectDomain").value.trim();
    const description = document.getElementById("projectDescription").value.trim();

    if (!title || !domain || !description) {
      notify("Please fill in Title, Domain, and Description.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("domain", domain);
    formData.append("description", description);
    const tagsInput = document.getElementById("projectTags");
    const tagsStr = tagsInput ? tagsInput.value : "";
    if (tagsStr) {
      tagsStr.split(",").forEach(tag => {
        const t = tag.trim();
        if (t) formData.append("tags", t);
      });
    }

    const githubInput = document.getElementById("projectGithub");
    const deployInput = document.getElementById("projectDeploy");
    if (githubInput) formData.append("githubLink", githubInput.value.trim());
    if (deployInput) formData.append("deployLink", deployInput.value.trim());

    const files = fileInput.files;
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    const submitOriginalLabel = submitBtn.textContent;
    submitBtn.textContent = "Uploading...";
    submitBtn.disabled = true;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${getApiBaseUrl()}/api/projects`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        notify(result.message || "Upload failed.");
        return;
      }

      notify("Project uploaded successfully.");
      form.reset();
      fileList.textContent = "";

      renderDashboardData();
      const projectsLink = document.querySelector('[data-panel="userProjects"]');
      if (projectsLink) projectsLink.click();
      else redirectToDashboard();
    } catch (error) {
      notify("Upload failed: " + (error.message || "Network error. Please try a smaller file."));
    } finally {
      submitBtn.textContent = submitOriginalLabel;
      submitBtn.disabled = false;
    }
  });
}

function renderDashboardData() {
  const user = getCurrentUser();
  if (!user) return;

  const adminPanel = document.getElementById("dashPanelAdmin");
  const userPanel = document.getElementById("dashPanelUser");

  if (user.role === "admin") {
    if (adminPanel) loadAdminDashboardData();
  } else {
    if (userPanel) loadUserDashboardData(user);
  }
}

async function loadAdminDashboardData() {
  const user = getCurrentUser();
  const token = localStorage.getItem("authToken");
  const list = document.getElementById("adminUserList");

  try {
    const [usersRes, projRes] = await Promise.all([
      fetch(`${getApiBaseUrl()}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${getApiBaseUrl()}/api/projects?limit=1`)
    ]);

    const usersResult = await usersRes.json();
    if (!usersRes.ok || !usersResult.success) {
      if (list) list.innerHTML = `<li style="list-style:none; color:var(--text-secondary);">Error loading users: ${usersResult.message || 'Unauthorized'}</li>`;
      return;
    }
    const users = usersResult.data || [];
    const projResult = await projRes.json();

    const totalUsersEl = document.getElementById("adminTotalUsers");
    const totalProjectsEl = document.getElementById("adminTotalProjects");
    if (totalUsersEl) totalUsersEl.textContent = users.length;
    if (totalProjectsEl) totalProjectsEl.textContent = projResult.data?.pagination?.total || 0;

    if (!list) return;
    if (!users.length) {
      list.innerHTML = "<li>No users found.</li>";
      return;
    }
    list.innerHTML = "";
    users.forEach((u) => {
      const isCurrentUser = u._id === user._id || u.id === user.id;
      const isAdmin = u.role === "admin";

      const li = document.createElement("li");
      li.className = "user-list-item glass reveal visible";
      li.style.padding = "1.25rem 1.5rem";
      li.style.borderRadius = "15px";
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";
      li.style.listStyle = "none";
      li.style.border = "1px solid rgba(255,255,255,0.05)";
      li.style.transition = "all 0.3s ease";

      li.innerHTML = `
        <div class="user-info" style="display: flex; align-items: center; gap: 1rem;">
          <div class="user-avatar" style="width: 45px; height: 45px; background: ${isAdmin ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.05)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
            ${isAdmin ? '👑' : '👤'}
          </div>
          <div>
            <p style="margin:0; font-weight:700; color:#fff; font-size: 1.05rem;">
              ${u.name} ${isCurrentUser ? '<span class="badge" style="background:rgba(99,102,241,0.2); color:#a5b4fc; margin-left:8px; font-size:0.7rem;">You</span>' : ''}
            </p>
            <p style="margin:4px 0 0; font-size:0.85rem; color:var(--text-secondary);">${u.email} • <span style="text-transform: capitalize; color: ${isAdmin ? '#a5b4fc' : 'inherit'}">${u.role}</span></p>
          </div>
        </div>
        <div class="user-actions">
          ${(isAdmin) ? '' : `
            <button class="btn btn-danger delete-user-btn" 
                    style="padding: 8px 16px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px;" 
                    data-id="${u._id || u.id}">Delete User</button>
          `}
        </div>
      `;
      list.appendChild(li);
    });
    list.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
          const delRes = await fetch(`${getApiBaseUrl()}/api/users/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          const delResult = await delRes.json();
          if (delRes.ok && delResult.success) {
            notify("User deleted successfully");
            loadAdminDashboardData();
          } else {
            notify("Failed to delete user: " + delResult.message);
          }
        } catch (err) {
          notify("Error deleting user.");
        }
      });
    });
  } catch (error) {
    console.error(error);
  }
}

async function loadUserDashboardData(user) {
  try {
    loadFriendsData();
    const dashUserName = document.getElementById("dashUserName");
    if (dashUserName) dashUserName.textContent = user.name || "User";

    // Fetch full profile info
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const profileRes = await fetch(`${getApiBaseUrl()}/api/users/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const profileResult = await profileRes.json();
        if (profileRes.ok && profileResult.success) {
          const u = profileResult.data;
          
          const dashUserBio = document.getElementById("dashUserBio");
          if (dashUserBio) {
            dashUserBio.textContent = u.bio || "Manage your portfolio and showcase your latest innovations.";
          }
          
          const bioInput = document.getElementById("profileBioInput");
          if (bioInput) bioInput.value = u.bio || "";
          
          if (u.profilePicture) {
            const img = document.getElementById("dashProfileImg");
            const initials = document.getElementById("dashProfileInitials");
            if (img && initials) {
              img.src = `${getApiBaseUrl()}${u.profilePicture}`;
              img.style.display = "block";
              initials.style.display = "none";
            }
          }
        }
      } catch (e) {
        console.error("Error fetching profile", e);
      }
    }

    const res = await fetch(`${getApiBaseUrl()}/api/projects?user=${user._id || user.id}`);
    const result = await res.json();
    const projects = result.data?.items || [];

    const totalUploadsEl = document.getElementById("userTotalUploads");
    if (totalUploadsEl) totalUploadsEl.textContent = result.data?.pagination?.total || projects.length;

    const list = document.getElementById("userProjectsList");
    if (!list) return;

    if (!projects.length) {
      list.innerHTML = `
        <li class="glass" style="padding: 3rem; text-align: center; color: var(--text-secondary); border-radius: 20px; list-style: none;">
          <p style="font-size: 1.2rem; margin-bottom: 1.5rem;">You haven't shared any innovation yet.</p>
          <button class="btn btn-primary" onclick="window.scrollTo({top: document.getElementById('dashPanelUpload').offsetTop - 120, behavior: 'smooth'})">Get Started - Upload Now</button>
        </li>`;
      return;
    }

    list.innerHTML = "";
    projects.forEach(p => {
      const li = document.createElement("li");
      li.className = "glass project-list-item reveal visible";
      li.style.padding = "1.5rem";
      li.style.marginBottom = "1rem";
      li.style.borderRadius = "20px";
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.justifyContent = "space-between";
      li.style.gap = "1.5rem";
      li.style.listStyle = "none";
      li.style.transition = "all 0.3s ease";

      li.innerHTML = `
        <div class="project-info" style="display: flex; align-items: center; gap: 1.5rem;">
          <div class="project-domain-icon" style="width: 54px; height: 54px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem;">
            ${getDomainIcon(p.domain)}
          </div>
          <div class="project-details">
            <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.4rem; color: var(--text-primary);">${p.title}</h4>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 0.6rem;">
              <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #a5b4fc; font-size: 0.75rem; padding: 4px 10px; border-radius: 100px;">${p.domain}</span>
              ${(p.tags || []).slice(0, 3).map(t => `<span class="badge" style="background: rgba(255,255,255,0.05); color: #94a3b8; font-size: 0.75rem; padding: 4px 10px; border-radius: 100px;">${t}</span>`).join('')}
            </div>
            <p style="font-size: 0.85rem; color: #64748b;">Shared on ${new Date(p.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
        <div class="project-actions" style="display: flex; gap: 0.75rem;">
          ${p.fileUrl ? `<a href="${getApiBaseUrl()}${p.fileUrl}" download class="btn btn-secondary" style="padding: 10px 20px; font-size: 0.85rem; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center;">Download</a>` : ''}
          <button class="btn btn-secondary edit-proj-btn" style="padding: 10px 20px; font-size: 0.85rem; border-radius: 10px;">Edit</button>
          <button class="btn btn-danger delete-proj-btn" style="padding: 10px 20px; font-size: 0.85rem; border-radius: 10px; background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2);">Delete</button>
        </div>`;

      li.querySelector(".edit-proj-btn").addEventListener("click", () => openEditProjectModal(p));
      li.querySelector(".delete-proj-btn").addEventListener("click", () => deleteProject(p._id));

      list.appendChild(li);
    });

    if (typeof setupScrollReveal === 'function') setupScrollReveal();
  } catch (err) {
    console.error(err);
  }
}

function getDomainIcon(domain) {
  const icons = {
    'AI': '🤖',
    'Web Dev': '🌐',
    'IoT': '📡',
    'Mobile': '📱',
    'Data Science': '📊',
    'Cybersecurity': '🛡️',
    'Other': '📁'
  };
  return icons[domain] || '📁';
}

function openEditProjectModal(project) {
  document.getElementById("editProjectId").value = project._id;
  document.getElementById("editProjectTitle").value = project.title;
  document.getElementById("editProjectDomain").value = project.domain;
  document.getElementById("editProjectDifficulty").value = project.difficulty || "Medium";
  document.getElementById("editProjectDescription").value = project.description;
  document.getElementById("editProjectTags").value = (project.tags || []).join(", ");

  if (document.getElementById("editProjectGithub")) {
    document.getElementById("editProjectGithub").value = project.githubLink || "";
  }
  if (document.getElementById("editProjectDeploy")) {
    document.getElementById("editProjectDeploy").value = project.deployLink || "";
  }

  const modal = document.getElementById("editProjectModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }
}

function setupDashboardControls() {
  const editModal = document.getElementById("editProjectModal");
  const editModalClose = document.getElementById("editModalClose");
  const editForm = document.getElementById("editProjectForm");

  if (editModalClose) {
    editModalClose.addEventListener("click", () => {
      editModal.classList.add("hidden");
      editModal.setAttribute("aria-hidden", "true");
    });
  }

  if (editModal) {
    editModal.addEventListener("click", (event) => {
      if (event.target.dataset.closeEditModal === "true") {
        editModal.classList.add("hidden");
        editModal.setAttribute("aria-hidden", "true");
      }
    });
  }

  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editProjectId").value;
      const payload = {
        title: document.getElementById("editProjectTitle").value,
        domain: document.getElementById("editProjectDomain").value,
        difficulty: document.getElementById("editProjectDifficulty").value,
        description: document.getElementById("editProjectDescription").value,
        tags: document.getElementById("editProjectTags").value.split(",").map(t => t.trim()).filter(Boolean),
        githubLink: document.getElementById("editProjectGithub")?.value || "",
        deployLink: document.getElementById("editProjectDeploy")?.value || "",
      };

      const token = localStorage.getItem("authToken");
      const submitBtn = document.getElementById("editProjectSubmitBtn");
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/projects/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (res.ok && result.success) {
          notify("Project updated successfully");
          editModal.classList.add("hidden");
          renderDashboardData();
        } else {
          notify(result.message || "Failed to update project");
        }
      } catch (err) {
        notify("Network error while updating project");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Save Changes";
      }
    });
  }
}

function setupAuth() {
  const tabs = [...document.querySelectorAll(".tab")];
  const title = document.getElementById("authTitle");
  const nameField = document.getElementById("nameField");
  const authForm = document.getElementById("authForm");
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const authToggle = document.querySelector(".auth-toggle");

  const nameInput = document.getElementById("authName");
  const emailInput = document.getElementById("authEmail");
  const passwordInput = document.getElementById("authPassword");
  const submitBtn = document.getElementById("authSubmitBtn");

  let authMode = "login";

  function setAuthMode(mode) {
    authMode = mode;
    const isSignup = mode === "signup";
    if (title) title.textContent = isSignup ? "Create Account" : "Welcome Back";
    if (nameField) nameField.classList.toggle("hidden", !isSignup);
    if (submitBtn) submitBtn.textContent = isSignup ? "Sign Up" : "Login";

    // Also show/hide the password field forgot link
    const forgotLink = document.getElementById("forgotPasswordLink");
    if (forgotLink) forgotLink.style.display = isSignup ? "none" : "block";

    tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setAuthMode(tab.dataset.mode));
  });

  // Toggle Forms Logic
  function showForm(formToShow) {
    [authForm, forgotPasswordForm, resetPasswordForm].forEach(f => {
      if (f) f.classList.add("hidden");
    });
    if (formToShow) formToShow.classList.remove("hidden");

    if (authToggle) {
      authToggle.style.display = formToShow === authForm ? "flex" : "none";
    }
  }

  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      showForm(forgotPasswordForm);
    });
  }

  ["backToLoginLink1", "backToLoginLink2"].forEach(id => {
    const link = document.getElementById(id);
    if (link) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        showForm(authForm);
      });
    }
  });

  if (authForm) {
    authForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password || (authMode === "signup" && !name)) {
        notify("Please fill all fields.");
        return;
      }

      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = "Processing...";

      try {
        const endpoint = authMode === "signup" ? "/api/auth/register" : "/api/auth/login";
        const body = authMode === "signup" ? { name, email, password } : { email, password };
        const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const result = await response.json();

        if (response.ok && result.success) {
          setAuthSession(result.data.user, result.data.token);
          notify(authMode === "signup" ? "Account created!" : "Welcome back!");
          updateAuthNavUI();
          redirectToDashboard();
        } else {
          notify(result.message || "Authentication failed.");
        }
      } catch (error) {
        notify("Server connection failed. Please check your internet or try again later.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    });
  }

  let resetEmailAddress = "";

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("forgotEmail").value.trim();
      if (!email) return notify("Please enter your email.");

      const btn = document.getElementById("forgotSubmitBtn");
      btn.disabled = true;
      btn.textContent = "Sending...";

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/auth/forgotpassword`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const result = await response.json();

        if (response.ok && result.success) {
          notify(result.message || "OTP sent to your email!");
          resetEmailAddress = email; // Store for the next step
          showForm(resetPasswordForm);
        } else {
          notify(result.message || "Failed to send OTP.");
        }
      } catch (error) {
        notify("Server connection failed.");
      } finally {
        btn.disabled = false;
        btn.textContent = "Send OTP";
      }
    });
  }

  if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const otp = document.getElementById("resetOtp").value.trim();
      const newPassword = document.getElementById("resetPassword").value.trim();

      if (!otp || !newPassword) return notify("Please fill all fields.");

      const btn = document.getElementById("resetSubmitBtn");
      btn.disabled = true;
      btn.textContent = "Updating...";

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/auth/resetpassword`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmailAddress, otp, newPassword }),
        });
        const result = await response.json();

        if (response.ok && result.success) {
          notify("Password updated successfully! Please login.");
          document.getElementById("resetOtp").value = "";
          document.getElementById("resetPassword").value = "";
          document.getElementById("forgotEmail").value = "";
          showForm(authForm);
        } else {
          notify(result.message || "Failed to reset password. OTP might be invalid or expired.");
        }
      } catch (error) {
        notify("Server connection failed.");
      } finally {
        btn.disabled = false;
        btn.textContent = "Update Password";
      }
    });
  }

  // Initialize Google Sign-In
  setTimeout(() => {
    if (window.google && document.getElementById("googleSignInBtn")) {
      window.google.accounts.id.initialize({
        client_id: "839038105434-hmhlfchn4a9rc5uh02orp21hkstjt7he.apps.googleusercontent.com",
        callback: window.handleGoogleCredentialResponse
      });
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInBtn"),
        { theme: "outline", size: "large", type: "standard", text: "signin_with", width: 400 }
      );
    }
  }, 500);
}

window.handleGoogleCredentialResponse = async function (response) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
    });
    const result = await res.json();
    if (res.ok && result.success) {
      setAuthSession(result.data.user, result.data.token);
      notify("Google Login successful!");
      updateAuthNavUI();
      redirectToDashboard();
    } else {
      notify(result.message || "Google Authentication failed.");
    }
  } catch (error) {
    notify("Server connection failed during Google Login.");
  }
};

async function loadPlatformStats() {
  const projStat = document.getElementById("statProjectsCount");
  const userStat = document.getElementById("statUsersCount");
  if (!projStat && !userStat) return;

  try {
    const ts = Date.now();
    const [projRes, usersRes] = await Promise.all([
      fetch(`${getApiBaseUrl()}/api/projects?limit=1&_=${ts}`),
      fetch(`${getApiBaseUrl()}/api/public/count?_=${ts}`)
    ]);

    const projResult = await projRes.json();
    if (projResult.success && projStat) {
      projStat.textContent = projResult.data?.pagination?.total || 0;
    }

    if (usersRes.ok && userStat) {
      const userResult = await usersRes.json();
      userStat.textContent = userResult.count || 0;
    }
  } catch (err) {
    console.error("Stats load failed", err);
  }
}

async function fetchProjectDetails(id) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/projects/${id}`);
    const result = await res.json();
    if (res.ok && result.success) {
      // Re-populate upvote/downvote and comments
      const project = result.data;
      const upvoteCount = document.getElementById("upvoteCount");
      const downvoteCount = document.getElementById("downvoteCount");
      if (upvoteCount) upvoteCount.textContent = project.upvotes?.length || 0;
      if (downvoteCount) downvoteCount.textContent = project.downvotes?.length || 0;
      renderComments(project.comments);
    }
  } catch (error) {
    console.error("Failed to refresh project details", error);
  }
}

function setupInteractions() {
  const upvoteBtn = document.getElementById("upvoteBtn");
  const downvoteBtn = document.getElementById("downvoteBtn");
  const commentForm = document.getElementById("commentForm");

  if (upvoteBtn) {
    upvoteBtn.addEventListener("click", async () => {
      const user = requireAuth();
      if (!user || !currentOpenProjectId) return;
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${getApiBaseUrl()}/api/projects/${currentOpenProjectId}/upvote`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) fetchProjectDetails(currentOpenProjectId);
        else notify("Failed to upvote");
      } catch (err) { notify("Network error"); }
    });
  }

  if (downvoteBtn) {
    downvoteBtn.addEventListener("click", async () => {
      const user = requireAuth();
      if (!user || !currentOpenProjectId) return;
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${getApiBaseUrl()}/api/projects/${currentOpenProjectId}/downvote`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) fetchProjectDetails(currentOpenProjectId);
        else notify("Failed to downvote");
      } catch (err) { notify("Network error"); }
    });
  }

  if (commentForm) {
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = requireAuth();
      if (!user || !currentOpenProjectId) return;
      const input = document.getElementById("commentInput");
      const text = input.value.trim();
      if (!text) return;

      const submitBtn = commentForm.querySelector("button");
      submitBtn.disabled = true;
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${getApiBaseUrl()}/api/projects/${currentOpenProjectId}/comment`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ text })
        });
        if (res.ok) {
          input.value = "";
          fetchProjectDetails(currentOpenProjectId);
        } else {
          notify("Failed to post comment");
        }
      } catch (err) { notify("Network error"); }
      finally { submitBtn.disabled = false; }
    });
  }
}

function init() {
  window.addEventListener("hashchange", showSectionByHash);
  showSectionByHash();

  if (menuToggleButton && navWrap) {
    menuToggleButton.addEventListener("click", () => navWrap.classList.toggle("open"));
  }

  if (logoutNavBtn) {
    logoutNavBtn.addEventListener("click", () => {
      localStorage.removeItem("authUser");
      localStorage.removeItem("authToken");
      notify("Logged out successfully.");
      updateAuthNavUI();
      window.location.href = "index.html";
    });
  }

  updateAuthNavUI();

  // Auto-redirect if already logged in and on auth page
  if (window.location.pathname.endsWith("auth.html") && getCurrentUser()) {
    redirectToDashboard();
  }

  setupExplore();
  setupUploadForm();
  setupAuth();
  setupDashboardControls();
  renderDashboardData();
  setupScrollReveal();
  loadPlatformStats();
  setupInteractions();
  setupProfileUpdate();
  setupFriendSystem();
  loadLeaderboard();
}

function setupFriendSystem() {
  const searchForm = document.getElementById("navFriendSearchForm");
  const searchInput = document.getElementById("navFriendSearchInput");
  const resultsList = document.getElementById("navFriendSearchResults");

  if (searchForm && searchInput && resultsList) {
    // Hide dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!searchForm.contains(e.target)) {
        resultsList.style.display = "none";
      }
    });

    // Handle input directly for live search (optional) or on submit
    searchForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (!query) {
        resultsList.style.display = "none";
        return;
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        notify("Please login to search for friends.");
        return;
      }

      resultsList.style.display = "block";
      resultsList.innerHTML = "<li style='padding: 10px; color: #94a3b8;'>Searching...</li>";

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/users/search?q=${encodeURIComponent(query)}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await res.json();
        
        if (res.ok && result.success) {
          if (result.data.length === 0) {
            resultsList.innerHTML = "<li style='padding: 10px; color: #94a3b8;'>No users found.</li>";
            return;
          }
          
          resultsList.innerHTML = result.data.map(u => `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(99,102,241,0.2); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 1rem;">
                  ${u.profilePicture ? `<img src="${getApiBaseUrl()}${u.profilePicture}" style="width: 100%; height: 100%; object-fit: cover;">` : '👤'}
                </div>
                <div>
                  <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); cursor: pointer; text-decoration: underline;" onclick="openPublicProfile('${u._id}')">${u.name}</div>
                  <div style="font-size: 0.7rem; color: #94a3b8;">${u.email}</div>
                </div>
              </div>
              <button class="btn btn-primary" onclick="sendFriendRequest('${u._id}')" style="padding: 4px 8px; font-size: 0.7rem;">Add</button>
            </li>
          `).join('');
        } else {
          resultsList.innerHTML = "<li style='padding: 10px; color: #ef4444;'>Search failed.</li>";
        }
      } catch (err) {
        resultsList.innerHTML = "<li style='padding: 10px; color: #ef4444;'>Network error.</li>";
      }
    });
  }

  // Load friends data when dashboard or network page is opened
  document.querySelectorAll('.nav-links a[href="user-dashboard.html"], .nav-links a[href="network.html"]').forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(loadFriendsData, 200);
    });
  });

  if (window.location.pathname.endsWith("network.html") || window.location.pathname.endsWith("user-dashboard.html")) {
    setTimeout(loadFriendsData, 200);
  }
}

async function loadFriendsData() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  const reqSection = document.getElementById("networkPagePendingRequests");
  const friendsList = document.getElementById("networkPageFriendsList");

  if (!friendsList && !document.getElementById("friendRequestsSection")) return;
  
  // Backwards compatibility with dashboard if it's still caching or user hasn't refreshed
  const dashReqSection = document.getElementById("friendRequestsSection");
  const dashReqList = document.getElementById("friendRequestsList");
  const dashFriendsList = document.getElementById("friendsList");

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/users/friends`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();

    if (res.ok && result.success) {
      const data = result.data;
      
      // Render pending requests
      const pendingHTML = data.friendRequests.length > 0 ? data.friendRequests.map(u => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; transition: transform 0.2s; cursor: pointer;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'" onclick="openPublicProfile('${u._id}')">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(99,102,241,0.2); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                ${u.profilePicture ? `<img src="${getApiBaseUrl()}${u.profilePicture}" style="width: 100%; height: 100%; object-fit: cover;">` : '👤'}
              </div>
              <div>
                <div style="font-size: 1rem; font-weight: 600; color: var(--text-primary);">${u.name}</div>
                <div style="font-size: 0.85rem; color: #94a3b8;">wants to be your friend</div>
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-primary" onclick="event.stopPropagation(); acceptFriendRequest('${u._id}')" style="padding: 6px 16px; font-size: 0.85rem;">Accept</button>
              <button class="btn btn-secondary" onclick="event.stopPropagation(); rejectFriendRequest('${u._id}')" style="padding: 6px 16px; font-size: 0.85rem;">Decline</button>
            </div>
          </div>
        `).join('') : "<div style='text-align: center; color: var(--text-secondary); padding: 1rem 0;'>No pending requests</div>";

      if (reqSection) {
        reqSection.innerHTML = pendingHTML;
      }
      if (dashReqSection && dashReqList) {
        if (data.friendRequests.length > 0) {
          dashReqSection.style.display = "block";
          dashReqList.innerHTML = pendingHTML;
        } else {
          dashReqSection.style.display = "none";
        }
      }

      // Render friends
      const friendsHTML = data.friends.length > 0 ? data.friends.map(u => `
          <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 24px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; transition: transform 0.2s; cursor: pointer;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'" onclick="openPublicProfile('${u._id}')">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(99,102,241,0.2); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin-bottom: 12px; border: 2px solid rgba(99,102,241,0.5);">
              ${u.profilePicture ? `<img src="${getApiBaseUrl()}${u.profilePicture}" style="width: 100%; height: 100%; object-fit: cover;">` : '👤'}
            </div>
            <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); text-align: center;">${u.name}</div>
            <div style="font-size: 0.85rem; color: #94a3b8; text-align: center; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; height: 36px;">${u.bio || 'No bio provided'}</div>
            
            <div style="display: flex; gap: 8px; width: 100%;">
              <button class="btn btn-primary" onclick="event.stopPropagation(); openChatModal('${u._id}')" style="flex: 1; padding: 8px; font-size: 0.85rem;">Message</button>
              <button class="btn btn-secondary" onclick="event.stopPropagation(); removeFriend('${u._id}')" style="padding: 8px; font-size: 0.85rem; color: #f87171;" title="Remove Friend">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
        `).join('') : "<div style='color: #94a3b8; font-size: 0.95rem; text-align: center; grid-column: 1 / -1; padding: 2rem 0;'>You haven't added any friends yet. Use the search bar to find people!</div>";

      if (friendsList) {
        friendsList.innerHTML = friendsHTML;
      }
      if (dashFriendsList) {
        dashFriendsList.innerHTML = friendsHTML;
      }
    }
  } catch (err) {
    console.error("Failed to load friends", err);
  }
}

// Global functions for friend actions
window.sendFriendRequest = async function(id) {
  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/users/friends/request/${id}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    notify(result.message || (result.success ? "Request sent" : "Failed to send request"));
  } catch(e) { notify("Network error"); }
};

window.acceptFriendRequest = async function(id) {
  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/users/friends/accept/${id}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    notify(result.message || (result.success ? "Request accepted" : "Failed to accept"));
    if (result.success) loadFriendsData();
  } catch(e) { notify("Network error"); }
};

window.rejectFriendRequest = async function(id) {
  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/users/friends/reject/${id}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    notify(result.message || (result.success ? "Request rejected" : "Failed to reject"));
    if (result.success) loadFriendsData();
  } catch(e) { notify("Network error"); }
};

window.removeFriend = async function(id) {
  if (!confirm("Are you sure you want to remove this friend?")) return;
  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/users/friends/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    notify(result.message || (result.success ? "Friend removed" : "Failed to remove"));
    if (result.success) loadFriendsData();
  } catch(e) { notify("Network error"); }
};

function setupProfileUpdate() {
  const profileUpdateForm = document.getElementById("profileUpdateForm");
  const editBtn = document.getElementById("profilePicEditBtn");
  const pictureInput = document.getElementById("profilePictureInput");
  const profileImg = document.getElementById("dashProfileImg");
  const profileInitials = document.getElementById("dashProfileInitials");

  if (editBtn && pictureInput) {
    // Click edit button to trigger file input
    editBtn.addEventListener("click", () => pictureInput.click());

    // Show preview immediately when file is selected
    pictureInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (profileImg && profileInitials) {
            profileImg.src = e.target.result;
            profileImg.style.display = "block";
            profileInitials.style.display = "none";
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (!profileUpdateForm) return;

  profileUpdateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const bioInput = document.getElementById("profileBioInput").value.trim();
    const pictureInput = document.getElementById("profilePictureInput");

    const formData = new FormData();
    formData.append("bio", bioInput);
    if (pictureInput.files.length > 0) {
      formData.append("profilePicture", pictureInput.files[0]);
    }

    const submitBtn = document.getElementById("profileSubmitBtn");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Saving...";
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/users/me`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const result = await res.json();
      
      if (res.ok && result.success) {
        notify("Profile updated successfully!");
        renderDashboardData(); // Refresh to show new info
      } else {
        notify(result.message || "Failed to update profile");
      }
    } catch (err) {
      notify("Network error updating profile");
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

function setupScrollReveal() {
  const observerOptions = {
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        // Once visible, we can stop observing
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

async function deleteProject(id) {
  if (!confirm("Are you sure you want to permanently delete this project? This action cannot be undone.")) return;

  const token = localStorage.getItem("authToken");
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/projects/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    if (res.ok && result.success) {
      notify("Project deleted successfully");
      renderDashboardData();
    } else {
      notify(result.message || "Failed to delete project");
    }
  } catch (err) {
    notify("Network error while deleting project");
  }
}

async function loadLeaderboard() {
  const leaderboardBody = document.getElementById("leaderboardBody");
  if (!leaderboardBody) return;

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/public/leaderboard`);
    const result = await res.json();
    
    if (res.ok && result.success) {
      leaderboardBody.innerHTML = "";
      if (!result.data || result.data.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-secondary);">No data available yet.</td></tr>';
        return;
      }
      
      result.data.forEach((user, index) => {
        const rank = index + 1;
        let rankClass = "rank-other";
        if (rank === 1) rankClass = "rank-1";
        else if (rank === 2) rankClass = "rank-2";
        else if (rank === 3) rankClass = "rank-3";
        
        const row = document.createElement("tr");
        row.className = "leaderboard-row";
        
        row.innerHTML = `
          <td class="leaderboard-cell"><span class="${rankClass}">#${rank}</span></td>
          <td class="leaderboard-cell" style="font-weight: 500; color: #f1f5f9;">
            <span style="cursor: pointer; text-decoration: underline;" onclick="openPublicProfile('${user._id}')">${user.name}</span>
          </td>
          <td class="leaderboard-cell" style="text-align: center; color: #a5b4fc;">${user.projectCount}</td>
          <td class="leaderboard-cell" style="text-align: right; font-weight: bold; color: var(--text-primary);">${user.totalScore}</td>
        `;
        leaderboardBody.appendChild(row);
      });
    } else {
      leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-secondary);">Failed to load leaderboard.</td></tr>';
    }
  } catch (err) {
    leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-secondary);">Network error loading leaderboard.</td></tr>';
  }
}

window.toggleFriendFromChat = async function() {
  if (!window.currentChatUserId) return;
  const token = localStorage.getItem("authToken");
  if (!token) return;

  const isFriend = window.currentChatIsFriend;
  const endpoint = isFriend ? `/api/users/friends/${window.currentChatUserId}` : `/api/users/friends/request/${window.currentChatUserId}`;
  const method = isFriend ? "DELETE" : "POST";
  
  try {
    const res = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: method,
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    
    if (res.ok && result.success) {
      notify(isFriend ? "Friend removed" : "Friend request sent");
      toggleChatOptionsMenu(); // close menu
      openChatModal(window.currentChatUserId); // Refresh UI
    } else {
      notify(result.message || "Failed to process request");
    }
  } catch (err) {
    notify("Network error");
  }
}

window.toggleBlockUser = async function() {
  if (!window.currentChatUserId) return;
  const token = localStorage.getItem("authToken");
  if (!token) return;
  
  if (!window.currentChatHasBlocked && !confirm("Are you sure you want to block this user? They will not be able to message you or send friend requests.")) {
    return;
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/users/block/${window.currentChatUserId}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    
    if (res.ok && result.success) {
      notify(result.message);
      toggleChatOptionsMenu(); // close menu
      openChatModal(window.currentChatUserId); // Refresh UI
    } else {
      notify(result.message || "Failed to block user");
    }
  } catch (err) {
    notify("Network error");
  }
}

document.addEventListener("DOMContentLoaded", init);
// Add inline documentation to backend
// Tweak auth styling
// Refactor database connection string handling
// Update styling for leaderboard
// Add comments to user dashboard
// Minor UI enhancements for mobile
// Prepare project for deployment
// Finalize frontend layouts
// Add inline documentation to backend
// Tweak auth styling
// Refactor database connection string handling
// Update styling for leaderboard
// Add comments to user dashboard
// Minor UI enhancements for mobile
// Prepare project for deployment
// Finalize frontend layouts
