const form = document.querySelector("#profileForm");
const recommendationsEl = document.querySelector("#recommendations");
const emptyState = document.querySelector("#emptyState");
const matchCount = document.querySelector("#matchCount");
const chatMessages = document.querySelector("#chatMessages");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const directoryEl = document.querySelector("#careerDirectory");
const careerSearch = document.querySelector("#careerSearch");
const resetBtn = document.querySelector("#resetBtn");

let latestMatches = [];
let activeCareer = null;

function titleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9+#\s]/g, " ").replace(/\s+/g, " ").trim();
}

function selectedValues(containerId) {
  return [...document.querySelectorAll(`#${containerId} input:checked`)].map((input) => input.value);
}

function uniqueMatches(source, target) {
  const targetSet = new Set(target.map(normalize));
  return source.filter((item) => targetSet.has(normalize(item)));
}

function buildChoices() {
  const groups = [
    ["interestChoices", PROFILE_OPTIONS.interests],
    ["strengthChoices", PROFILE_OPTIONS.strengths]
  ];

  groups.forEach(([containerId, values]) => {
    const container = document.querySelector(`#${containerId}`);
    container.innerHTML = values.map((value) => `
      <label class="chip-option">
        <input type="checkbox" value="${value}" />
        <span>${titleCase(value)}</span>
      </label>
    `).join("");
  });
}

function readProfile() {
  const skills = normalize(document.querySelector("#skillsInput").value)
    .split(/[\s,]+/)
    .filter(Boolean);

  return {
    name: document.querySelector("#nameInput").value.trim() || "there",
    education: document.querySelector("#educationInput").value,
    interests: selectedValues("interestChoices"),
    strengths: selectedValues("strengthChoices"),
    workStyle: document.querySelector("#workStyleInput").value,
    skills
  };
}

function scoreCareer(career, profile) {
  const interestMatches = uniqueMatches(career.interests, profile.interests);
  const strengthMatches = uniqueMatches(career.strengths, profile.strengths);
  const skillMatches = career.skills.filter((skill) => {
    const normalizedSkill = normalize(skill);
    return profile.skills.some((userSkill) => normalizedSkill.includes(userSkill) || userSkill.includes(normalizedSkill));
  });
  const styleMatch = career.workStyles.includes(profile.workStyle);
  const educationMatch = career.education.includes(profile.education);

  const interestScore = career.interests.length ? (interestMatches.length / career.interests.length) * 35 : 0;
  const strengthScore = career.strengths.length ? (strengthMatches.length / career.strengths.length) * 25 : 0;
  const skillScore = career.skills.length ? Math.min(skillMatches.length / 4, 1) * 20 : 0;
  const styleScore = styleMatch ? 10 : 0;
  const educationScore = educationMatch ? 10 : 4;
  const total = Math.round(interestScore + strengthScore + skillScore + styleScore + educationScore);

  return {
    ...career,
    score: Math.min(total, 100),
    matchDetails: {
      interests: interestMatches,
      strengths: strengthMatches,
      skills: skillMatches,
      styleMatch,
      educationMatch
    }
  };
}

function recommend(profile) {
  return CAREERS
    .map((career) => scoreCareer(career, profile))
    .sort((a, b) => b.score - a.score || b.beginnerFriendly - a.beginnerFriendly);
}

function renderRecommendations(matches) {
  latestMatches = matches.slice(0, 3);
  activeCareer = latestMatches[0] || null;
  emptyState.hidden = latestMatches.length > 0;
  matchCount.textContent = latestMatches.length ? `${latestMatches.length} matches` : "Waiting";

  recommendationsEl.innerHTML = latestMatches.map((career, index) => {
    const detailTags = [
      ...career.matchDetails.interests,
      ...career.matchDetails.strengths,
      ...career.matchDetails.skills
    ].slice(0, 6);

    return `
      <article class="career-card">
        <div class="career-card-top">
          <div class="career-icon">${career.icon}</div>
          <div>
            <span class="rank-label">Match ${index + 1}</span>
            <h3>${career.title}</h3>
          </div>
          <div class="score-ring" style="--score:${career.score}%">${career.score}%</div>
        </div>
        <p>${career.summary}</p>
        <div class="mini-facts">
          <span>Demand: ${career.demand}</span>
          <span>Salary: ${career.salary}</span>
          <span>Beginner fit: ${career.beginnerFriendly}%</span>
        </div>
        <div class="tag-row">
          ${detailTags.length ? detailTags.map((tag) => `<span>${titleCase(tag)}</span>`).join("") : "<span>Explore to build fit</span>"}
        </div>
        <div class="roadmap">
          ${career.roadmap.slice(0, 3).map((step) => `<div><span></span>${step}</div>`).join("")}
        </div>
        <button class="secondary-button" type="button" data-chat-career="${career.id}">Chat about this path</button>
      </article>
    `;
  }).join("");
}

function renderDirectory(filter = "") {
  const query = normalize(filter);
  const careers = CAREERS.filter((career) => {
    const haystack = normalize(`${career.title} ${career.summary} ${career.skills.join(" ")} ${career.interests.join(" ")}`);
    return haystack.includes(query);
  });

  directoryEl.innerHTML = careers.map((career) => `
    <button class="directory-card" type="button" data-directory-career="${career.id}">
      <span>${career.icon}</span>
      <strong>${career.title}</strong>
      <small>${career.skills.slice(0, 3).join(" • ")}</small>
    </button>
  `).join("");
}

function addMessage(sender, text) {
  const message = document.createElement("div");
  message.className = `message ${sender}`;
  message.innerHTML = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatList(items) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function courseSearchQuery(career) {
  return encodeURIComponent(`${career.title} ${career.skills.slice(0, 3).join(" ")}`);
}

function courseLinks(career) {
  const query = courseSearchQuery(career);
  const courseraUrl = `https://www.coursera.org/search?query=${query}&productTypeDescription=Courses`;
  const udemyUrl = `https://www.udemy.com/courses/search/?q=${query}`;

  return `
    <div class="course-links">
      <strong>Helpful course searches:</strong>
      <a href="${courseraUrl}" target="_blank" rel="noopener noreferrer">Coursera courses for ${career.title}</a>
      <a href="${udemyUrl}" target="_blank" rel="noopener noreferrer">Udemy courses for ${career.title}</a>
    </div>
  `;
}

function chooseCareerFromText(text) {
  const normalizedText = normalize(text);
  return CAREERS.find((career) => normalizedText.includes(normalize(career.title))) ||
    CAREERS.find((career) => career.skills.some((skill) => normalizedText.includes(normalize(skill)))) ||
    activeCareer ||
    latestMatches[0] ||
    null;
}

function botReply(input) {
  const text = normalize(input);
  const career = chooseCareerFromText(text);
  const profile = readProfile();

  if (text.includes("recommend") || text.includes("choose") || text.includes("best fit") || text.includes("which career")) {
    if (!latestMatches.length) {
      return "Complete your learner profile and generate recommendations first. Then I can explain which career fits you best.";
    }

    const top = latestMatches[0];
    return `Your strongest match is <strong>${top.title}</strong> at <strong>${top.score}%</strong>. It fits because of ${top.matchDetails.interests.concat(top.matchDetails.strengths).slice(0, 4).map(titleCase).join(", ") || "your selected profile"}. ${top.summary}`;
  }

  if (!career) {
    return "Tell me a career name or generate your recommendations first, and I will guide you with skills, roadmap, projects, and next steps.";
  }

  activeCareer = career;

  if (text.includes("roadmap") || text.includes("plan") || text.includes("steps")) {
    return `<strong>${career.title} roadmap:</strong>${formatList(career.roadmap)}Start with the first two steps this week, then build one small project.${courseLinks(career)}`;
  }

  if (text.includes("skill") || text.includes("learn")) {
    return `<strong>Important skills for ${career.title}:</strong>${formatList(career.skills)}For you, start with ${career.skills.slice(0, 3).join(", ")} because they create the foundation fastest.${courseLinks(career)}`;
  }

  if (text.includes("course") || text.includes("coursera") || text.includes("udemy")) {
    return `Here are course searches matched to <strong>${career.title}</strong> and its core skills: ${career.skills.slice(0, 4).join(", ")}.${courseLinks(career)}`;
  }

  if (text.includes("tool") || text.includes("software")) {
    return `<strong>Useful tools for ${career.title}:</strong>${formatList(career.tools)}`;
  }

  if (text.includes("salary") || text.includes("income") || text.includes("pay")) {
    return `${career.title} usually has <strong>${career.salary}</strong> earning potential, with <strong>${career.demand}</strong> demand. Salary depends on portfolio quality, internships, location, and interview readiness.`;
  }

  if (text.includes("project") || text.includes("portfolio")) {
    return `<strong>Portfolio ideas for ${career.title}:</strong>${formatList(career.nextActions)}Pick one and finish it before starting another. Completed proof matters more than a long plan.`;
  }

  if (text.includes("confused") || text.includes("not sure") || text.includes("help")) {
    return `That is normal, ${profile.name}. Compare your top career by three things: interest, skill-building energy, and real projects you can tolerate doing repeatedly. For now, explore <strong>${career.title}</strong> with one beginner project: ${career.nextActions[0]}.`;
  }

  return `<strong>${career.title}</strong> could be a good path if you enjoy ${career.interests.slice(0, 3).join(", ")} and are willing to build skills like ${career.skills.slice(0, 4).join(", ")}. Ask me for a roadmap, skills, salary, tools, or projects.`;
}

function greetBot() {
  addMessage("bot", "Hi, I’m your Skillhance career guide. Fill the profile to get recommendations, or ask me about skills, roadmap, salary, projects, or any career in the dataset.");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const profile = readProfile();
  const matches = recommend(profile);
  renderRecommendations(matches);

  const top = matches[0];
  addMessage("bot", `I found your top match: <strong>${top.title}</strong> (${top.score}%). Ask me for a roadmap or portfolio projects for this path.`);
});

recommendationsEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-chat-career]");
  if (!button) return;
  activeCareer = CAREERS.find((career) => career.id === button.dataset.chatCareer);
  addMessage("bot", `Great choice. Ask me anything about <strong>${activeCareer.title}</strong>, or type “roadmap” to get started.`);
});

directoryEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-directory-career]");
  if (!button) return;
  activeCareer = CAREERS.find((career) => career.id === button.dataset.directoryCareer);
  addMessage("bot", `<strong>${activeCareer.title}</strong>: ${activeCareer.summary} Ask for skills, roadmap, tools, salary, or projects.`);
});

document.querySelector("#quickPrompts").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const prompt = button.dataset.prompt;
  addMessage("user", prompt);
  addMessage("bot", botReply(prompt));
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value) return;
  addMessage("user", value);
  chatInput.value = "";
  addMessage("bot", botReply(value));
});

careerSearch.addEventListener("input", (event) => renderDirectory(event.target.value));

resetBtn.addEventListener("click", () => {
  form.reset();
  latestMatches = [];
  activeCareer = null;
  recommendationsEl.innerHTML = "";
  emptyState.hidden = false;
  matchCount.textContent = "Waiting";
  addMessage("bot", "Profile reset. Choose fresh interests and strengths whenever you are ready.");
});

buildChoices();
renderDirectory();
greetBot();
