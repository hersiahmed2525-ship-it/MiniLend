const API_URL = "https://jsonplaceholder.typicode.com";

// 1. Get HTML elements
const categoryList = document.getElementById("categoryList");
const cardList = document.getElementById("cardList");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const addCardBtn = document.getElementById("addCardBtn");
const filterSelect = document.getElementById("filterSelect");
const activeCategoryTitle = document.getElementById("activeCategoryTitle");
const emptyMessage = document.getElementById("emptyMessage");
const errorMessage = document.getElementById("error-message");
const modalForm = document.getElementById("modalForm");
const modalTitle = document.getElementById("modalTitle");
const modalFields = document.getElementById("modalFields");

// 2. Store data
let categories = [
  { id: 1, name: "School" },
  { id: 2, name: "Friends" },
];
let lendCards = [];
let activeCategory = "School";

// 3. Create the Bootstrap modal
const myModal = new bootstrap.Modal(document.getElementById("myModal"));

// 4. Helper functions
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("d-none");
}

function hideError() {
  errorMessage.textContent = "";
  errorMessage.classList.add("d-none");
}

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 5. Render Category Buttons
function renderCategories() {
  categoryList.innerHTML = "";

  categories.forEach(function (category) {
    const wrapper = document.createElement("div");
    wrapper.className =
      "d-flex align-items-center gap-1 bg-white border rounded";

    const button = document.createElement("button");
    button.textContent = category.name;
    button.className = "btn btn-sm border-0";

    if (category.name === activeCategory) {
      button.classList.add("active", "bg-dark", "text-white");
    }

    button.addEventListener("click", function () {
      activeCategory = category.name;
      addCardBtn.disabled = false;
      hideError();
      renderCategories();
      renderCards();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "&times;";
    deleteBtn.className = "btn btn-sm text-danger border-0 py-0 px-2";
    deleteBtn.title = "Delete Category";

    deleteBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      const confirmDelete = confirm(`Delete category "${category.name}"?`);
      if (confirmDelete) {
        deleteCategory(category.id, category.name);
      }
    });

    wrapper.appendChild(button);
    wrapper.appendChild(deleteBtn);
    categoryList.appendChild(wrapper);
  });

  addCategoryBtn.className = "btn btn-dark btn-sm";
  addCardBtn.disabled = !activeCategory;
}

// 6. Render Lending Cards
function renderCards() {
  cardList.innerHTML = "";
  activeCategoryTitle.textContent = activeCategory || "Select a category";
  const today = getToday();

  const filteredCards = lendCards.filter(function (card) {
    const matchesCategory = card.category === activeCategory;
    const isOverdue = Boolean(card.date && card.date < today);

    if (filterSelect.value === "overdue") {
      return matchesCategory && isOverdue;
    }
    return matchesCategory;
  });

  filteredCards.forEach(function (card) {
    const column = document.createElement("div");
    column.className = "col-md-6 col-lg-4";

    const cardBox = document.createElement("div");
    cardBox.className = "card h-100 shadow-sm";

    const body = document.createElement("div");
    body.className = "card-body";

    const heading = document.createElement("h3");
    heading.className = "h5";
    heading.textContent = card.item;

    const borrower = document.createElement("p");
    borrower.textContent = `Borrower: ${card.borrower}`;

    const date = document.createElement("p");
    date.textContent = `Return date: ${card.date || "Not set"}`;

    body.append(heading, borrower, date);

    if (card.date && card.date < today) {
      const overdueMessage = document.createElement("p");
      overdueMessage.className = "text-danger fw-bold";
      overdueMessage.textContent = "Overdue!";
      body.appendChild(overdueMessage);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-outline-danger btn-sm w-100 mt-2";
    deleteBtn.textContent = "Mark Returned";

    deleteBtn.addEventListener("click", function () {
      const confirmDelete = confirm("Mark as returned? This cannot be undone.");
      if (confirmDelete) {
        deleteCard(card.id);
      }
    });

    body.appendChild(deleteBtn);
    cardBox.appendChild(body);
    column.appendChild(cardBox);
    cardList.appendChild(column);
  });

  if (filteredCards.length === 0) {
    emptyMessage.textContent =
      filterSelect.value === "overdue"
        ? "No overdue items in this category."
        : "No lend cards yet. Add one!";
    emptyMessage.classList.remove("d-none");
  }
  else {
    emptyMessage.classList.add("d-none");
  }
}

// 7. DELETE Requests
async function deleteCard(id) {
  hideError();
  try {
    const response = await fetch(`${API_URL}/posts/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Could not delete card");

    lendCards = lendCards.filter(function (card) {
      return card.id !== id;
    });
    renderCards();
  } catch (error) {
    showError("Could not delete the card. Please try again.");
  }
}

async function deleteCategory(id, name) {
  hideError();
  try {
    const response = await fetch(`${API_URL}/posts/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Could not delete category");

    categories = categories.filter(function (cat) {
      return cat.id !== id;
    });

    if (activeCategory === name) {
      activeCategory = categories.length > 0 ? categories[0].name : "";
      addCardBtn.disabled = !activeCategory;
    }
    renderCategories();
    renderCards();
  } catch (error) {
    showError("Could not delete the category. Please try again.");
  }
}

// 8. Modal: Add Category (Click)
addCategoryBtn.addEventListener("click", function () {
  hideError();
  modalTitle.textContent = "Add Category";
  modalFields.innerHTML = `
    <label for="categoryName" class="form-label">Category name</label>
    <input type="text" id="categoryName" class="form-control" maxlength="40" required>
  `;
  myModal.show();
});

// 9. Modal: Add Card (Click)
addCardBtn.addEventListener("click", function () {
  hideError();
  if (!activeCategory) {
    showError("Please select a category first.");
    return;
  }
  modalTitle.textContent = "Add Lend Card";
  modalFields.innerHTML = `
    <div class="mb-3">
        <label for="itemName" class="form-label">Item name</label>
        <input type="text" id="itemName" class="form-control" maxlength="100" required>
    </div>
    <div class="mb-3">
        <label for="borrowerName" class="form-label">Borrower name</label>
        <input type="text" id="borrowerName" class="form-control" maxlength="100" required>
    </div>
    <div class="mb-3">
        <label for="returnDate" class="form-label">Return date</label>
        <input type="date" id="returnDate" class="form-control">
    </div>
  `;
  myModal.show();
});

// 10. POST Request: Save Form (Submit)
modalForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  hideError();

  // Disable button to prevent double-clicks
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  try {
    let url = "";
    let newData = {};

    // Check if it's a CATEGORY form
    const categoryInput = document.getElementById("categoryName");
    if (categoryInput) {
      const name = categoryInput.value.trim();
      if (!name) {
        showError("Please enter a category name.");
        return;
      }

      const alreadyExists = categories.some(function (c) {
        return c.name.toLowerCase() === name.toLowerCase();
      });
      if (alreadyExists) {
        showError("This category already exists.");
        return;
      }

      const newCategory = { id: Date.now(), name: name };
      categories.push(newCategory);
      activeCategory = newCategory.name;
      renderCategories();
      renderCards();
      myModal.hide();
      modalForm.reset();
      return;
    }

    // Check if it's a CARD form
    const itemInput = document.getElementById("itemName");
    if (itemInput) {
      const item = itemInput.value.trim();
      const borrower = document.getElementById("borrowerName").value.trim();
      const date = document.getElementById("returnDate").value;

      if (!item || !borrower) {
        showError("Please enter item and borrower name.");
        return;
      }

      url = `${API_URL}/posts`;
      newData = {
        title: item,
        body: borrower,
        userId: 1,
        date: date,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });

      if (!response.ok) throw new Error("Could not save the data");

      const savedData = await response.json();

      lendCards.push({
        id: Date.now(),
        category: activeCategory,
        item: savedData.title,
        borrower: savedData.body,
        date: savedData.date,
      });

      renderCards();
      modalForm.reset();
      myModal.hide();
    }
  } catch (error) {
    showError("Could not save your data. Please try again.");
  } finally {
    // Re-enable the button when done (success or fail)
    submitBtn.disabled = false;
    submitBtn.textContent = "Save";
  }
});

// 11. Change Event: Filter (Change)
filterSelect.addEventListener("change", function () {
  hideError();
  renderCards();
});

// 12. Start App
renderCategories();
renderCards();

// Force scroll to app dashboard
const launchBtn = document.querySelector('a[href="#app-dashboard"]');
if (launchBtn) {
  launchBtn.addEventListener("click", function (e) {
    e.preventDefault();
    const dashboard = document.getElementById("app-dashboard");
    if (dashboard) {
      dashboard.scrollIntoView(); // Forces the jump
    }
  });
}
