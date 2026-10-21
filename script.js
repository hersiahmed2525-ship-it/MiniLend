// ============================================================
// MiniLend — script.js
// This file talks to the json-server API and updates the page.
// ============================================================

// The address of our API (json-server)
const API = "http://localhost:3000";

// These variables remember the current state of the app
let categories = []; // all categories from the API
let cards = []; // all cards from the API
let activeCategoryId = null; // which category is selected
let editingCardId = null; // which card we are editing (null = creating new)

// ---------- GET ELEMENTS FROM THE PAGE ----------
// We find elements once and store them so we don't search every time.

const categoryListEl = document.getElementById("categoryList");
const cardListEl = document.getElementById("cardList");
const activeCategoryTitleEl = document.getElementById("activeCategoryTitle");
const emptyMessageEl = document.getElementById("emptyMessage");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const addCardBtn = document.getElementById("addCardBtn");

const modalEl = document.getElementById("myModal");
const modalTitle = document.getElementById("modalTitle");
const modalForm = document.getElementById("modalForm");
const modalFields = document.getElementById("modalFields");

// Bootstrap modal controller — lets us open and close the modal
const bsModal = new bootstrap.Modal(modalEl);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Show a red error message at the top of the screen
function showError(message) {
  // Remove any old banner first
  const oldBanner = document.getElementById("errorBanner");
  if (oldBanner) oldBanner.remove();

  // Create a new banner
  const banner = document.createElement("div");
  banner.id = "errorBanner";
  banner.className = "error-banner";
  banner.textContent = "⚠️ " + message;

  // Add it to the page
  document.body.appendChild(banner);

  // Remove it after 4 seconds
  setTimeout(() => banner.remove(), 4000);
}

// Make text safe before putting it in HTML (prevents broken layout)
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

// Format a date like "2026-10-01" into "Oct 1, 2026"
function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ============================================================
// API FUNCTIONS (talk to json-server)
// ============================================================

// GET all categories
async function getCategories() {
  const response = await fetch(API + "/categories");
  if (!response.ok) throw new Error("Could not load categories");
  return response.json();
}

// GET all cards
async function getCards() {
  const response = await fetch(API + "/cards");
  if (!response.ok) throw new Error("Could not load cards");
  return response.json();
}

// POST a new category
async function postCategory(name) {
  const response = await fetch(API + "/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name }),
  });
  if (!response.ok) throw new Error("Could not create category");
  return response.json();
}

// POST a new card
async function postCard(cardData) {
  const response = await fetch(API + "/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cardData),
  });
  if (!response.ok) throw new Error("Could not create card");
  return response.json();
}

// PATCH an existing card (update part of it)
async function patchCard(id, updates) {
  const response = await fetch(API + "/cards/" + id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Could not update card");
  return response.json();
}

// DELETE a category
async function deleteCategoryFromAPI(id) {
  const response = await fetch(API + "/categories/" + id, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Could not delete category");
}

// DELETE a card
async function deleteCardFromAPI(id) {
  const response = await fetch(API + "/cards/" + id, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Could not delete card");
}

// ============================================================
// LOAD DATA (called on page load and after every change)
// ============================================================

async function loadAllData() {
  try {
    // Get fresh data from the API
    categories = await getCategories();
    cards = await getCards();

    // If no category is selected but we have some, pick the first one
    if (activeCategoryId === null && categories.length > 0) {
      activeCategoryId = categories[0].id;
    }

    // Redraw the page with the new data
    renderCategories();
    renderCards();
  } catch (error) {
    console.error(error);
    showError("Could not connect to the server. Is json-server running?");
  }
}

// ============================================================
// DRAW THE PAGE
// ============================================================

function renderCategories() {
  // Clear the old chips
  categoryListEl.innerHTML = "";

  // If no categories, show a message
  if (categories.length === 0) {
    categoryListEl.innerHTML =
      '<span class="text-muted small">No categories yet.</span>';
    return;
  }

  // Create a chip for each category
  categories.forEach(function (category) {
    const chip = document.createElement("button");
    chip.type = "button";

    // Active category gets a dark button, others get outline
    if (category.id === activeCategoryId) {
      chip.className = "btn btn-sm btn-dark";
    }
    else {
      chip.className = "btn btn-sm btn-outline-dark";
    }

    // Show the name and a small ✕
    chip.innerHTML =
      escapeHtml(category.name) + ' <span class="ms-1 opacity-50">✕</span>';

    // Clicking the chip selects the category
    chip.addEventListener("click", function () {
      activeCategoryId = category.id;
      renderCategories();
      renderCards();
    });

    // Clicking the ✕ deletes the category
    chip
      .querySelector("span")
      .addEventListener("click", async function (event) {
        event.stopPropagation(); // don't also select the category
        await handleDeleteCategory(category.id);
      });

    categoryListEl.appendChild(chip);
  });
}

function renderCards() {
  // Clear old cards
  cardListEl.innerHTML = "";

  // Find the active category object
  const activeCategory = categories.find(function (c) {
    return c.id === activeCategoryId;
  });

  // If no active category, show placeholder
  if (!activeCategory) {
    activeCategoryTitleEl.textContent = "Select a category";
    emptyMessageEl.style.display = "block";
    emptyMessageEl.textContent = "Pick a category above, or create one.";
    addCardBtn.disabled = true;
    return;
  }

  // Show the active category name
  activeCategoryTitleEl.textContent = "📁 " + activeCategory.name;
  addCardBtn.disabled = false;

  // Filter cards that belong to this category
  const myCards = cards.filter(function (card) {
    return card.categoryId === activeCategory.id;
  });

  // If no cards, show empty message
  if (myCards.length === 0) {
    emptyMessageEl.style.display = "block";
    emptyMessageEl.textContent = "No lend cards in this category yet.";
    return;
  }

  emptyMessageEl.style.display = "none";

  // Create a card for each item
  myCards.forEach(function (card) {
    // Bootstrap column wrapper
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";

    // The card itself
    const cardEl = document.createElement("article");
    cardEl.className = "card h-100 border-0 shadow-sm";

    // Status badge
    const statusText = card.returned ? "Returned" : "Pending";
    const statusClass = card.returned ? "success" : "warning";

    cardEl.innerHTML =
      '<div class="card-body d-flex flex-column">' +
      '<h3 class="h6 mb-1">' +
      escapeHtml(card.borrower) +
      "</h3>" +
      '<p class="mb-2 small text-muted">📅 ' +
      formatDate(card.date) +
      "</p>" +
      '<p class="mb-2 fw-semibold">' +
      escapeHtml(card.item) +
      "</p>" +
      '<span class="badge bg-' +
      statusClass +
      ' align-self-start mb-3">' +
      statusText +
      "</span>" +
      '<div class="mt-auto d-flex gap-2">' +
      '<button class="btn btn-sm btn-outline-dark toggle-btn">' +
      (card.returned ? "Mark Pending" : "Mark Returned") +
      "</button>" +
      '<button class="btn btn-sm btn-outline-secondary edit-btn">Edit</button>' +
      '<button class="btn btn-sm btn-outline-danger delete-btn">Delete</button>' +
      "</div>" +
      "</div>";

    // Toggle returned status
    cardEl
      .querySelector(".toggle-btn")
      .addEventListener("click", async function () {
        try {
          await patchCard(card.id, { returned: !card.returned });
          await loadAllData();
        } catch (error) {
          console.error(error);
          showError("Could not update the card.");
        }
      });

    // Edit card
    cardEl.querySelector(".edit-btn").addEventListener("click", function () {
      openCardModal(card);
    });

    // Delete card
    cardEl
      .querySelector(".delete-btn")
      .addEventListener("click", async function () {
        if (!confirm("Delete this lend card?")) return;
        try {
          await deleteCardFromAPI(card.id);
          await loadAllData();
        } catch (error) {
          console.error(error);
          showError("Could not delete the card.");
        }
      });

    col.appendChild(cardEl);
    cardListEl.appendChild(col);
  });
}

// ============================================================
// MODAL: OPEN FOR NEW CATEGORY
// ============================================================

addCategoryBtn.addEventListener("click", function () {
  editingCardId = null;
  modalTitle.textContent = "New Category";

  // Put an input field inside the modal
  modalFields.innerHTML =
    '<div class="mb-3">' +
    '<label class="form-label">Category Name</label>' +
    '<input type="text" id="catName" class="form-control" ' +
    'placeholder="e.g. Money, Books, Food" required />' +
    "</div>";

  bsModal.show();

  // Focus the input so the user can type right away
  document.getElementById("catName").focus();
});

// ============================================================
// MODAL: OPEN FOR NEW CARD OR EDIT CARD
// ============================================================

function openCardModal(cardToEdit) {
  if (!activeCategoryId) return;

  editingCardId = cardToEdit ? cardToEdit.id : null;
  modalTitle.textContent = cardToEdit ? "Edit Lend Card" : "New Lend Card";

  // Use existing values if editing, otherwise empty
  const card = cardToEdit || {
    borrower: "",
    item: "",
    date: "",
    returned: false,
  };

  modalFields.innerHTML =
    '<div class="mb-3">' +
    '<label class="form-label">Borrower\'s Name</label>' +
    '<input type="text" id="cardBorrower" class="form-control" ' +
    'value="' +
    escapeHtml(card.borrower) +
    '" required />' +
    "</div>" +
    '<div class="mb-3">' +
    '<label class="form-label">Item</label>' +
    '<input type="text" id="cardItem" class="form-control" ' +
    'value="' +
    escapeHtml(card.item) +
    '" required />' +
    "</div>" +
    '<div class="mb-3">' +
    '<label class="form-label">Date Lent</label>' +
    '<input type="date" id="cardDate" class="form-control" ' +
    'value="' +
    card.date +
    '" required />' +
    "</div>" +
    '<div class="mb-3">' +
    '<label class="form-label">Status</label>' +
    '<select id="cardReturned" class="form-select">' +
    '<option value="false"' +
    (!card.returned ? " selected" : "") +
    ">Pending</option>" +
    '<option value="true"' +
    (card.returned ? " selected" : "") +
    ">Returned</option>" +
    "</select>" +
    "</div>";

  bsModal.show();
  document.getElementById("cardBorrower").focus();

  // CHANGE listener (requirement: at least one "change" listener)
  document
    .getElementById("cardReturned")
    .addEventListener("change", function (event) {
      console.log("Status changed to:", event.target.value);
    });
}

addCardBtn.addEventListener("click", function () {
  openCardModal(null);
});

// ============================================================
// MODAL: SUBMIT (save button)
// ============================================================

modalForm.addEventListener("submit", async function (event) {
  event.preventDefault(); // stop the page from reloading

  try {
    // ---- Is this the CATEGORY form? ----
    const catNameInput = document.getElementById("catName");
    if (catNameInput) {
      const name = catNameInput.value.trim();
      if (!name) return;

      await postCategory(name);
      bsModal.hide();
      await loadAllData();
      return;
    }

    // ---- Is this the CARD form? ----
    const borrowerInput = document.getElementById("cardBorrower");
    if (borrowerInput) {
      const payload = {
        categoryId: Number(activeCategoryId),
        borrower: borrowerInput.value.trim(),
        item: document.getElementById("cardItem").value.trim(),
        date: document.getElementById("cardDate").value,
        returned: document.getElementById("cardReturned").value === "true",
      };

      if (!payload.borrower || !payload.item || !payload.date) return;

      if (editingCardId !== null) {
        await patchCard(editingCardId, payload);
      }
      else {
        await postCard(payload);
      }

      editingCardId = null;
      bsModal.hide();
      await loadAllData();
      return;
    }
  } catch (error) {
    console.error(error);
    showError("Could not save. Please try again.");
  }
});

// ============================================================
// DELETE CATEGORY (and all its cards)
// ============================================================

async function handleDeleteCategory(categoryId) {
  if (!confirm("Delete this category and all its cards?")) return;

  try {
    // First, delete all cards in this category
    const cardsInCategory = cards.filter(function (card) {
      return card.categoryId === categoryId;
    });

    for (const card of cardsInCategory) {
      await deleteCardFromAPI(card.id);
    }

    // Then delete the category itself
    await deleteCategoryFromAPI(categoryId);

    // If the deleted category was active, pick a new one
    if (activeCategoryId === categoryId) {
      activeCategoryId = null;
    }

    await loadAllData();
  } catch (error) {
    console.error(error);
    showError("Could not delete the category.");
  }
}

// ============================================================
// START THE APP
// ============================================================

loadAllData();
