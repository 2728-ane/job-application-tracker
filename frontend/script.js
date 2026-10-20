
const $ = (id) => document.getElementById(id);

let token = sessionStorage.getItem("jobToken");
let userName = sessionStorage.getItem("jobUser") || "";
let applications = [];
let editingId = null;
let registering = false;

const statuses = ["Applied", "Interview", "Offer", "Rejected"];

async function api(endpoint, method = "GET", body) {
  const response = await fetch(endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }

  return data;
}

function showDashboard() {
  $("authSection").classList.toggle("hidden", !!token);
  $("dashboard").classList.toggle("hidden", !token);
  $("welcome").textContent = `Welcome, ${userName || "User"}!`;
}

$("toggleAuth").addEventListener("click", () => {
  registering = !registering;
  $("authTitle").textContent = registering ? "Create Account" : "Login";
  $("authSubmit").textContent = registering ? "Register" : "Login";
  $("nameGroup").classList.toggle("hidden", !registering);
  $("name").required = registering;
  $("toggleAuth").textContent = registering
    ? "Already have an account? Login"
    : "Don't have an account? Register";
  $("authMessage").textContent = "";
});

$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("email").value.trim();
  const password = $("password").value;
  const name = $("name").value.trim();

  $("authMessage").textContent = "";

  try {
    if (registering) {
      await api("/api/register", "POST", { name, email, password });
      $("toggleAuth").click();
      $("authMessage").textContent = "Account created! Please log in.";
      $("password").value = "";
    } else {
      const data = await api("/api/login", "POST", { email, password });
      token = data.token;
      userName = data.name;
      sessionStorage.setItem("jobToken", token);
      sessionStorage.setItem("jobUser", userName);
      showDashboard();
      await loadApplications();
    }
  } catch (error) {
    $("authMessage").textContent = error.message;
  }
});

$("logoutBtn").addEventListener("click", () => {
  token = null;
  userName = "";
  applications = [];
  sessionStorage.removeItem("jobToken");
  sessionStorage.removeItem("jobUser");
  showDashboard();
});

async function loadApplications() {
  try {
    applications = await api("/api/applications");
    $("appMessage").textContent = "";
    renderApplications();
  } catch (error) {
    $("appMessage").textContent = error.message;
    if (error.message.includes("token") || error.message.includes("log in")) {
      $("logoutBtn").click();
    }
  }
}

function renderApplications() {
  const search = $("search").value.toLowerCase();
  const filter = $("filterStatus").value;

  const visible = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(search) ||
      app.position.toLowerCase().includes(search);

    return matchesSearch && (filter === "All" || app.status === filter);
  });

  $("totalCount").textContent = applications.length;
  $("appliedCount").textContent =
    applications.filter((app) => app.status === "Applied").length;
  $("interviewCount").textContent =
    applications.filter((app) => app.status === "Interview").length;
  $("offerCount").textContent =
    applications.filter((app) => app.status === "Offer").length;

  const list = $("applicationsList");
  list.replaceChildren();

  if (visible.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No applications found.";
    list.appendChild(empty);
    return;
  }

  visible.forEach((app) => {
    const card = document.createElement("div");
    card.className = "application";

    const heading = document.createElement("h3");
    heading.textContent = `${app.position} — ${app.company}`;

    const details = document.createElement("p");
    details.textContent =
      `${app.status} | ${new Date(app.date).toLocaleDateString()}`;

    const actions = document.createElement("div");
    actions.className = "application-actions";

    const edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.addEventListener("click", () => editApplication(app._id));

    const remove = document.createElement("button");
    remove.textContent = "Delete";
    remove.className = "delete-btn";
    remove.addEventListener("click", () => deleteApplication(app._id));

    actions.append(edit, remove);
    card.append(heading, details, actions);
    list.appendChild(card);
  });
}

$("applicationForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const body = {
    company: $("company").value.trim(),
    position: $("position").value.trim(),
    status: $("status").value,
    date: $("date").value
  };

  try {
    if (editingId) {
      await api(`/api/applications/${editingId}`, "PUT", body);
    } else {
      await api("/api/applications", "POST", body);
    }

    resetForm();
    await loadApplications();
  } catch (error) {
    $("appMessage").textContent = error.message;
  }
});

function editApplication(id) {
  const app = applications.find((item) => item._id === id);
  if (!app) return;

  editingId = id;
  $("company").value = app.company;
  $("position").value = app.position;
  $("status").value = app.status;
  $("date").value = app.date.slice(0, 10);

  $("formTitle").textContent = "Edit Job Application";
  $("saveBtn").textContent = "Update Application";
  $("cancelEdit").classList.remove("hidden");

  $("applicationForm").scrollIntoView({ behavior: "smooth" });
}

async function deleteApplication(id) {
  if (!confirm("Delete this application?")) return;

  try {
    await api(`/api/applications/${id}`, "DELETE");
    await loadApplications();
  } catch (error) {
    $("appMessage").textContent = error.message;
  }
}

function resetForm() {
  editingId = null;
  $("applicationForm").reset();
  $("date").value = new Date().toLocaleDateString("en-CA");
  $("formTitle").textContent = "Add Job Application";
  $("saveBtn").textContent = "Save Application";
  $("cancelEdit").classList.add("hidden");
}

$("cancelEdit").addEventListener("click", resetForm);
$("search").addEventListener("input", renderApplications);
$("filterStatus").addEventListener("change", renderApplications);

resetForm();
showDashboard();

if (token) loadApplications();
