
const menu = document.getElementById("menuToggle");
const nav = document.getElementById("navLinks");

menu.addEventListener("click", () => {
  nav.classList.toggle("show");
});

document.querySelectorAll("#navLinks a").forEach(link => {
  link.addEventListener("click", () => nav.classList.remove("show"));
});

// Typing animation
const typing = document.getElementById("typing");

const words = [
  "BCA Student",
  "Web Developer",
  "Aspiring Developer",
  "Programmer"
];

let wi = 0;
let ci = 0;
let deleting = false;

const reduced = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

function typeEffect() {
  if (reduced) {
    typing.textContent = words[0];
    return;
  }

  const word = words[wi];
  typing.textContent = word.substring(0, ci);

  if (!deleting && ci < word.length) {
    ci++;
    setTimeout(typeEffect, 100);
  } else if (deleting && ci > 0) {
    ci--;
    setTimeout(typeEffect, 50);
  } else {
    deleting = !deleting;
    if (!deleting) wi = (wi + 1) % words.length;
    setTimeout(typeEffect, deleting ? 1000 : 300);
  }
}

typeEffect();

// Scroll reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach(el => {
  observer.observe(el);
});

// Load projects from database
async function loadProjects() {
  const container = document.getElementById("projectsGrid");

  try {
    const response = await fetch("/api/projects");
    if (!response.ok) throw new Error("Failed");

    const projects = await response.json();
    container.replaceChildren();

    projects.forEach(project => {
      const card = document.createElement("div");
      card.className = "project-card";

      const title = document.createElement("h3");
      title.textContent = "🚀 " + project.title;

      const description = document.createElement("p");
      description.textContent = project.description;

      const tech = document.createElement("small");
      tech.textContent = project.tech || "Development";

      const link = document.createElement("a");

      try {
        const url = new URL(project.link, location.origin);

        if (url.protocol === "https:" || url.origin === location.origin) {
          link.href = url.href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "View Project ↗";
        } else {
          link.textContent = "Link unavailable";
        }
      } catch {
        link.textContent = "Link unavailable";
      }

      card.append(title, description, tech, link);
      container.appendChild(card);
    });

    if (projects.length === 0) {
      container.textContent = "Projects coming soon!";
    }
  } catch (error) {
    container.textContent = "Projects could not be loaded.";
  }
}

loadProjects();

// Contact form
const form = document.getElementById("contactForm");
const status = document.getElementById("formStatus");

form.addEventListener("submit", async event => {
  event.preventDefault();

  const button = form.querySelector("button");
  button.disabled = true;
  status.textContent = "Sending...";

  const data = Object.fromEntries(new FormData(form));

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.message);

    status.textContent = "✓ " + result.message;
    form.reset();
  } catch (error) {
    status.textContent = "Error: " + error.message;
  } finally {
    button.disabled = false;
  }
});
