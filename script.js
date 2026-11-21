const defaultItems = [
  { id: 1, name: "Ethiopia Guji", sku: "COF-001", category: "Coffee", stock: 24, unit: "kg", threshold: 10, cost: 1850.00 },
  { id: 2, name: "Colombia Supremo", sku: "COF-002", category: "Coffee", stock: 8, unit: "kg", threshold: 10, cost: 1675.00 },
  { id: 3, name: "Whole Milk", sku: "MLK-014", category: "Milk & Dairy", stock: 42, unit: "bottles", threshold: 12, cost: 320.00 },
  { id: 4, name: "Vanilla Syrup", sku: "SYR-008", category: "Syrups", stock: 6, unit: "bottles", threshold: 8, cost: 840.00 },
  { id: 5, name: "Oat Milk", sku: "MLK-021", category: "Milk & Dairy", stock: 0, unit: "cartons", threshold: 15, cost: 415.00 },
  { id: 6, name: "Butter Croissant", sku: "BKR-003", category: "Bakery", stock: 18, unit: "pcs", threshold: 10, cost: 185.00 },
  { id: 7, name: "12oz Paper Cups", sku: "PKG-012", category: "Packaging", stock: 220, unit: "pcs", threshold: 100, cost: 12.00 },
  { id: 8, name: "Caramel Syrup", sku: "SYR-009", category: "Syrups", stock: 5, unit: "bottles", threshold: 8, cost: 840.00 }
];

let items = loadItems();
let activeStatus = "all";
let searchTerm = "";

const inventoryBody = document.getElementById("inventoryBody");
const emptyState = document.getElementById("emptyState");
const modal = document.getElementById("itemModal");
const form = document.getElementById("itemForm");

function loadItems() {
  try {
    const saved = localStorage.getItem("beanAndBrewInventory");
    if (!saved) return defaultItems;
    const storedItems = JSON.parse(saved);
    const currencyVersion = localStorage.getItem("beanAndBrewCurrency");
    if (currencyVersion === "PHP") return storedItems;

    const oldPesoPrices = {
      1: 18.50,
      2: 16.75,
      3: 3.20,
      4: 8.40,
      5: 4.15,
      6: 1.85,
      7: 0.12,
      8: 8.40
    };
    const pesoDefaults = Object.fromEntries(defaultItems.map(item => [item.id, item.cost]));
    const migratedItems = storedItems.map(item => ({
      ...item,
      cost: item.cost === oldPesoPrices[item.id] ? pesoDefaults[item.id] : item.cost
    }));
    localStorage.setItem("beanAndBrewInventory", JSON.stringify(migratedItems));
    localStorage.setItem("beanAndBrewCurrency", "PHP");
    return migratedItems;
  } catch {
    return defaultItems;
  }
}

function saveItems() {
  localStorage.setItem("beanAndBrewInventory", JSON.stringify(items));
}

function getStatus(item) {
  if (item.stock === 0) return { key: "out", label: "Out of stock", className: "out-of-stock" };
  if (item.stock <= item.threshold) return { key: "low", label: "Low stock", className: "low-stock" };
  return { key: "in", label: "In stock", className: "in-stock" };
}

function categoryIcon(category) {
  if (category === "Coffee") {
    return '<path d="M5 8h14v7.5A4.5 4.5 0 0 1 14.5 20h-5A4.5 4.5 0 0 1 5 15.5V8Zm14 2h1a3 3 0 0 1 0 6h-1M8 5c0-1 .7-1.5 1.5-2M12 5c0-1 .7-1.5 1.5-2"/>';
  }
  if (category === "Milk & Dairy") {
    return '<path d="M9 3h6l2 4v13H7V7l2-4Zm-2 4h10M10 11h4v5h-4z"/>';
  }
  if (category === "Syrups") {
    return '<path d="M9 3h6v4H9V3Zm1 4v2l-3 3v8h10v-8l-3-3V7M8 13h8"/>';
  }
  if (category === "Bakery") {
    return '<path d="M4 17c0-5 3-10 8-10s8 5 8 10H4Zm4-7 1 7m3-9v9m3-7-1 7"/>';
  }
  return '<path d="M4 7h16v12H4V7Zm3-3h10v3H7V4Zm2 7h6"/>';
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);
}

function render() {
  const category = document.getElementById("categoryFilter").value;
  const filtered = items.filter(item => {
    const status = getStatus(item);
    const matchesStatus = activeStatus === "all" || status.key === activeStatus;
    const matchesCategory = category === "all" || item.category === category;
    const haystack = `${item.name} ${item.sku} ${item.category}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm);
    return matchesStatus && matchesCategory && matchesSearch;
  });

  inventoryBody.innerHTML = filtered.map(item => {
    const status = getStatus(item);
    return `
      <tr>
        <td><input type="checkbox" aria-label="Select ${item.name}"></td>
        <td>
          <div class="item-cell">
            <div class="item-thumb"><svg viewBox="0 0 24 24">${categoryIcon(item.category)}</svg></div>
            <div class="item-info"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.sku)}</span></div>
          </div>
        </td>
        <td>${escapeHtml(item.category)}</td>
        <td><div class="stock-cell"><strong>${item.stock} ${escapeHtml(item.unit)}</strong><span>Threshold: ${item.threshold}</span></div></td>
        <td><span class="status-badge ${status.className}">${status.label}</span></td>
        <td>${formatCurrency(item.cost)}</td>
        <td>${formatCurrency(item.stock * item.cost)}</td>
        <td>
          <div class="row-actions">
            <div class="action-menu" data-id="${item.id}">
              <button class="icon-button menu-trigger" type="button" aria-label="Actions for ${escapeHtml(item.name)}">•••</button>
              <div class="action-popover">
                <button type="button" data-action="edit">Edit item</button>
                <button type="button" data-action="restock">Restock</button>
                <button type="button" class="delete-action" data-action="delete">Delete item</button>
              </div>
            </div>
          </div>
        </td>
      </tr>`;
  }).join("");

  emptyState.hidden = filtered.length !== 0;
  updateStats();
  document.getElementById("paginationInfo").textContent = `Showing ${filtered.length} of ${items.length} items`;
  bindActionMenus();
}

function updateStats() {
  const low = items.filter(item => getStatus(item).key === "low").length;
  const out = items.filter(item => getStatus(item).key === "out").length;
  const value = items.reduce((sum, item) => sum + item.stock * item.cost, 0);
  document.getElementById("totalItems").textContent = items.length;
  document.getElementById("inventoryValue").textContent = formatCurrency(value);
  document.getElementById("lowStockCount").textContent = low;
  document.getElementById("outOfStockCount").textContent = out;
  document.getElementById("allCount").textContent = items.length;
  document.getElementById("lowCount").textContent = low;
  document.getElementById("outCount").textContent = out;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function openModal(item = null) {
  form.reset();
  document.getElementById("itemId").value = item ? item.id : "";
  document.getElementById("modalTitle").textContent = item ? "Edit inventory item" : "Add new item";
  document.getElementById("saveItemButton").textContent = item ? "Save changes" : "Save item";

  if (item) {
    document.getElementById("itemName").value = item.name;
    document.getElementById("itemCategory").value = item.category;
    document.getElementById("itemStock").value = item.stock;
    document.getElementById("itemUnit").value = item.unit;
    document.getElementById("itemThreshold").value = item.threshold;
    document.getElementById("itemCost").value = item.cost;
  }
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("itemName").focus();
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function showToast(message) {
  document.getElementById("toastMessage").textContent = message;
  document.getElementById("toast").classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => document.getElementById("toast").classList.remove("show"), 2600);
}

function bindActionMenus() {
  document.querySelectorAll(".action-menu").forEach(menu => {
    const trigger = menu.querySelector(".menu-trigger");
    trigger.onclick = event => {
      event.stopPropagation();
      document.querySelectorAll(".action-menu.open").forEach(openMenu => {
        if (openMenu !== menu) openMenu.classList.remove("open");
      });
      menu.classList.toggle("open");
    };
    menu.querySelectorAll("[data-action]").forEach(button => {
      button.onclick = event => {
        event.stopPropagation();
        const id = Number(menu.dataset.id);
        const item = items.find(entry => entry.id === id);
        const action = button.dataset.action;
        if (action === "edit") openModal(item);
        if (action === "delete") {
          items = items.filter(entry => entry.id !== id);
          saveItems();
          render();
          showToast("Item deleted");
        }
        if (action === "restock") {
          item.stock += 10;
          saveItems();
          render();
          showToast(`${item.name} restocked`);
        }
        menu.classList.remove("open");
      };
    });
  });
}

document.getElementById("addItemButton").addEventListener("click", () => openModal());
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });

form.addEventListener("submit", event => {
  event.preventDefault();
  const id = Number(document.getElementById("itemId").value);
  const payload = {
    name: document.getElementById("itemName").value.trim(),
    category: document.getElementById("itemCategory").value,
    stock: Number(document.getElementById("itemStock").value),
    unit: document.getElementById("itemUnit").value.trim(),
    threshold: Number(document.getElementById("itemThreshold").value),
    cost: Number(document.getElementById("itemCost").value)
  };

  if (id) {
    const index = items.findIndex(item => item.id === id);
    items[index] = { ...items[index], ...payload };
    showToast("Item updated");
  } else {
    const nextId = items.length ? Math.max(...items.map(item => item.id)) + 1 : 1;
    const categoryCode = payload.category === "Coffee" ? "COF" : payload.category === "Milk & Dairy" ? "MLK" : payload.category === "Syrups" ? "SYR" : payload.category === "Bakery" ? "BKR" : "PKG";
    items.unshift({ id: nextId, sku: `${categoryCode}-${String(nextId).padStart(3, "0")}`, ...payload });
    showToast("Item added");
  }
  saveItems();
  closeModal();
  render();
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(entry => entry.classList.remove("active"));
    tab.classList.add("active");
    activeStatus = tab.dataset.filter;
    render();
  });
});

document.getElementById("categoryFilter").addEventListener("change", render);
document.getElementById("globalSearch").addEventListener("input", event => {
  searchTerm = event.target.value.trim().toLowerCase();
  render();
});

document.addEventListener("keydown", event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.getElementById("globalSearch").focus();
  }
  if (event.key === "Escape") {
    closeModal();
    closeAccountModal();
    closePasswordModal();
    closeConfirmModal();
    document.querySelectorAll(".action-menu.open").forEach(menu => menu.classList.remove("open"));
  }
});

document.addEventListener("click", () => {
  document.querySelectorAll(".action-menu.open").forEach(menu => menu.classList.remove("open"));
});

document.getElementById("selectAll").addEventListener("change", event => {
  document.querySelectorAll("#inventoryBody input[type='checkbox']").forEach(checkbox => {
    checkbox.checked = event.target.checked;
  });
});

document.getElementById("menuButton").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

document.getElementById("exportButton").addEventListener("click", () => {
  const header = ["Name", "SKU", "Category", "Stock", "Unit", "Threshold", "Unit Cost", "Value"];
  const rows = items.map(item => [item.name, item.sku, item.category, item.stock, item.unit, item.threshold, item.cost, (item.stock * item.cost).toFixed(2)]);
  const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "bean-and-brew-inventory.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Inventory exported");
});

const content = document.querySelector(".content");
const inventoryTemplate = content.innerHTML;

function navigateTo(view) {
  if (view === "inventory") {
    content.innerHTML = inventoryTemplate;
    document.getElementById("addItemButton").addEventListener("click", () => openModal());
    document.getElementById("categoryFilter").addEventListener("change", render);
    document.querySelectorAll(".tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(entry => entry.classList.remove("active"));
        tab.classList.add("active");
        activeStatus = tab.dataset.filter;
        render();
      });
    });
    document.getElementById("selectAll").addEventListener("change", event => {
      document.querySelectorAll("#inventoryBody input[type='checkbox']").forEach(checkbox => {
        checkbox.checked = event.target.checked;
      });
    });
    document.getElementById("exportButton").addEventListener("click", exportInventory);
    render();
    return;
  }
  if (view === "overview") renderOverview();
  if (view === "suppliers") renderSuppliers();
  if (view === "orders") renderOrders();
  if (view === "reports") renderReports();
  if (view === "settings") renderSettings();
  document.getElementById("sidebar").classList.remove("open");
}

function exportInventory() {
  const header = ["Name", "SKU", "Category", "Stock", "Unit", "Threshold", "Unit Cost", "Value"];
  const rows = items.map(item => [item.name, item.sku, item.category, item.stock, item.unit, item.threshold, item.cost, (item.stock * item.cost).toFixed(2)]);
  const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "boddlefighters-inventory.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Inventory exported");
}

function renderOverview() {
  const low = items.filter(item => getStatus(item).key === "low").length;
  const out = items.filter(item => getStatus(item).key === "out").length;
  const value = items.reduce((sum, item) => sum + item.stock * item.cost, 0);
  content.innerHTML = `
    <div class="module-heading"><div><p class="eyebrow">Daily snapshot</p><h1>Overview</h1></div><button class="primary-button" type="button" data-action="add-inventory">Add inventory</button></div>
    <div class="module-grid">
      <article class="metric-card"><span>Inventory value</span><strong>${formatCurrency(value)}</strong><small>+2.8% this month</small></article>
      <article class="metric-card"><span>Low stock items</span><strong>${low}</strong><small>Needs attention</small></article>
      <article class="metric-card"><span>Out of stock</span><strong>${out}</strong><small>Immediate restock</small></article>
    </div>
    <div class="chart-card"><h3>Stock movement</h3><div class="bar-chart">
      <div style="height:48%"></div><div style="height:64%"></div><div style="height:58%"></div><div style="height:78%"></div><div style="height:68%"></div><div class="active" style="height:88%"></div><div style="height:72%"></div>
    </div></div>`;
  content.querySelector("[data-action='add-inventory']").addEventListener("click", () => navigateTo("inventory"));
}

function renderSettings() {
  content.innerHTML = `
    <div class="module-heading"><div><p class="eyebrow">System preferences</p><h1>Settings</h1></div><button class="primary-button" id="openAccountFromSettings" type="button">Manage account</button></div>
    <div class="settings-grid">
      <div class="settings-tabs">
        <button class="settings-tab active" type="button">Shop profile</button>
        <button class="settings-tab" type="button">Notifications</button>
        <button class="settings-tab" type="button">Security</button>
      </div>
      <div class="settings-card">
        <div class="settings-card-header"><h3>Shop profile</h3></div>
        <form id="shopProfileForm">
          <div class="form-grid">
            <label class="field full">Shop name<input id="shopName" type="text" required value="${escapeHtml(loadAccount().shopName || "BoddleFighters")}"></label>
            <label class="field full">Address<input id="shopAddress" type="text" value="Makati City, Philippines"></label>
            <label class="field">Currency<select id="shopCurrency"><option>PHP - Philippine Peso</option></select></label>
            <label class="field">Timezone<select><option>Asia/Manila (GMT+8)</option></select></label>
          </div>
          <div class="modal-actions"><button class="primary-button" type="submit">Save settings</button></div>
        </form>
      </div>
    </div>`;
  document.getElementById("openAccountFromSettings").addEventListener("click", openAccountModal);
  document.getElementById("shopProfileForm").addEventListener("submit", event => {
    event.preventDefault();
    const account = loadAccount();
    account.shopName = document.getElementById("shopName").value.trim();
    saveAccount(account);
    document.querySelector(".brand strong").textContent = account.shopName;
    showToast("Shop settings saved");
  });
  document.querySelectorAll(".settings-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".settings-tab").forEach(entry => entry.classList.remove("active"));
      tab.classList.add("active");
      if (!tab.textContent.includes("Shop profile")) showToast(`${tab.textContent.trim()} preferences selected`);
    });
  });
}

function renderSuppliers() {
  const suppliers = JSON.parse(localStorage.getItem("boddleSuppliers") || "[]");
  content.innerHTML = `
    <div class="module-heading"><div><p class="eyebrow">Vendor directory</p><h1>Suppliers</h1></div><button class="primary-button" id="addSupplierButton" type="button">Add supplier</button></div>
    <div class="data-card"><div class="data-card-header"><h3>Active suppliers</h3><span class="status-badge in-stock">${suppliers.length + 3} contacts</span></div>
      <div class="table-wrap"><table class="compact-table"><thead><tr><th>Supplier</th><th>Category</th><th>Contact</th><th>Status</th></tr></thead><tbody>
        <tr><td><strong>Manila Coffee Imports</strong></td><td>Beans & Coffee</td><td>(02) 8123-4567</td><td><span class="status-badge in-stock">Active</span></td></tr>
        <tr><td><strong>Dairy Metro</strong></td><td>Milk & Dairy</td><td>(02) 8555-0148</td><td><span class="status-badge in-stock">Active</span></td></tr>
        <tr><td><strong>SweetLife Supplies</strong></td><td>Syrups & Bakery</td><td>(02) 8888-2231</td><td><span class="status-badge in-stock">Active</span></td></tr>
        ${suppliers.map(s => `<tr><td><strong>${escapeHtml(s.name)}</strong></td><td>${escapeHtml(s.category)}</td><td>${escapeHtml(s.contact)}</td><td><span class="status-badge in-stock">Active</span></td></tr>`).join("")}
      </tbody></table></div></div>`;
  document.getElementById("addSupplierButton").addEventListener("click", () => {
    const name = window.prompt("Supplier name");
    if (!name) return;
    const category = window.prompt("Supplier category", "General supplies");
    const contact = window.prompt("Contact number", "");
    suppliers.push({ name, category: category || "General supplies", contact: contact || "No contact" });
    localStorage.setItem("boddleSuppliers", JSON.stringify(suppliers));
    renderSuppliers();
    showToast("Supplier added");
  });
}

function renderOrders() {
  content.innerHTML = `
    <div class="module-heading"><div><p class="eyebrow">Purchase tracking</p><h1>Orders</h1></div><button class="primary-button" id="createOrderButton" type="button">Create order</button></div>
    <div class="data-card"><div class="data-card-header"><h3>Recent orders</h3><span id="orderCount" class="status-badge low-stock">3 orders</span></div>
      <div class="table-wrap"><table class="compact-table"><thead><tr><th>Order</th><th>Supplier</th><th>Total</th><th>Status</th></tr></thead><tbody>
        <tr><td><strong>PO-1048</strong></td><td>Manila Coffee Imports</td><td>₱18,500.00</td><td><span class="status-badge in-stock">Delivered</span></td></tr>
        <tr><td><strong>PO-1049</strong></td><td>Dairy Metro</td><td>₱6,240.00</td><td><span class="status-badge low-stock">In transit</span></td></tr>
        <tr><td><strong>PO-1050</strong></td><td>SweetLife Supplies</td><td>₱4,880.00</td><td><span class="status-badge out-of-stock">Pending</span></td></tr>
      </tbody></table></div></div>`;
  document.getElementById("createOrderButton").addEventListener("click", () => showToast("New purchase order workflow opened"));
}

function renderReports() {
  content.innerHTML = `
    <div class="module-heading"><div><p class="eyebrow">Business insights</p><h1>Reports</h1></div><button class="primary-button" id="reportExportButton" type="button">Export report</button></div>
    <div class="module-grid">
      <article class="metric-card"><span>Items tracked</span><strong>${items.length}</strong><small>Complete inventory</small></article>
      <article class="metric-card"><span>Low stock</span><strong>${items.filter(item => getStatus(item).key === "low").length}</strong><small>Review soon</small></article>
      <article class="metric-card"><span>Inventory value</span><strong>${formatCurrency(items.reduce((sum, item) => sum + item.stock * item.cost, 0))}</strong><small>Current valuation</small></article>
    </div>
    <div class="chart-card"><h3>Inventory health</h3><div class="bar-chart">
      <div class="active" style="height:82%"></div><div style="height:68%"></div><div style="height:74%"></div><div style="height:90%"></div><div style="height:62%"></div><div style="height:76%"></div>
    </div></div>`;
  document.getElementById("reportExportButton").addEventListener("click", exportInventory);
}

document.querySelectorAll(".nav-item[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item[data-view]").forEach(entry => entry.classList.remove("active"));
    button.classList.add("active");
    navigateTo(button.dataset.view);
  });
});

function loadAccount() {
  try {
    return JSON.parse(localStorage.getItem("boddleAccount")) || {
      name: "Rene Baternoia",
      email: "rene@boddlefighters.ph",
      role: "Store manager",
      phone: "",
      shopName: "BoddleFighters"
    };
  } catch {
    return { name: "Rene Baternoia", email: "rene@boddlefighters.ph", role: "Store manager", phone: "", shopName: "BoddleFighters" };
  }
}

function saveAccount(account) {
  localStorage.setItem("boddleAccount", JSON.stringify(account));
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function applyAccount() {
  const account = loadAccount();
  document.querySelector(".avatar").textContent = initials(account.name);
  document.querySelector(".user-meta strong").textContent = account.name;
  document.querySelector(".user-meta span").textContent = account.role;
  document.querySelector(".brand strong").textContent = account.shopName || "BoddleFighters";
  document.getElementById("accountName").value = account.name;
  document.getElementById("accountEmail").value = account.email;
  document.getElementById("accountRole").value = account.role;
  document.getElementById("accountPhone").value = account.phone || "";
  document.getElementById("accountAvatar").textContent = initials(account.name);
  document.getElementById("accountPreviewName").textContent = account.name;
  document.getElementById("menuAvatar").textContent = initials(account.name);
  document.getElementById("menuAccountName").textContent = account.name;
  document.getElementById("menuAccountEmail").textContent = account.email;
}

function openAccountModal() {
  applyAccount();
  document.getElementById("accountModal").classList.add("open");
  document.getElementById("accountModal").setAttribute("aria-hidden", "false");
  document.getElementById("accountName").focus();
}

function closeAccountModal() {
  document.getElementById("accountModal").classList.remove("open");
  document.getElementById("accountModal").setAttribute("aria-hidden", "true");
}

document.getElementById("userMenuButton").addEventListener("click", event => {
  event.stopPropagation();
  const menu = document.getElementById("accountMenu");
  menu.classList.toggle("open");
  menu.setAttribute("aria-hidden", menu.classList.contains("open") ? "false" : "true");
  document.getElementById("userCard").setAttribute("aria-expanded", menu.classList.contains("open") ? "true" : "false");
});

document.getElementById("userCard").addEventListener("click", event => {
  if (event.target.closest("#userMenuButton")) return;
  document.getElementById("userMenuButton").click();
});

document.getElementById("userCard").addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    document.getElementById("userMenuButton").click();
  }
});

document.querySelectorAll("[data-account-action]").forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.accountAction;
    document.getElementById("accountMenu").classList.remove("open");
    document.getElementById("accountMenu").setAttribute("aria-hidden", "true");
    document.getElementById("userCard").setAttribute("aria-expanded", "false");
    if (action === "profile") openAccountModal();
    if (action === "password") openPasswordModal();
    if (action === "signout") openConfirmModal(
      "Sign out?",
      "You will need to sign in again to manage this inventory.",
      "Sign out",
      () => showToast("Signed out safely")
    );
  });
});

function openPasswordModal() {
  document.getElementById("passwordForm").reset();
  document.getElementById("passwordModal").classList.add("open");
  document.getElementById("passwordModal").setAttribute("aria-hidden", "false");
  document.getElementById("currentPassword").focus();
}

function closePasswordModal() {
  document.getElementById("passwordModal").classList.remove("open");
  document.getElementById("passwordModal").setAttribute("aria-hidden", "true");
}

document.getElementById("closePasswordModal").addEventListener("click", closePasswordModal);
document.getElementById("cancelPasswordModal").addEventListener("click", closePasswordModal);
document.getElementById("passwordModal").addEventListener("click", event => {
  if (event.target === event.currentTarget) closePasswordModal();
});

document.getElementById("passwordForm").addEventListener("submit", event => {
  event.preventDefault();
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  if (newPassword !== confirmPassword) {
    document.getElementById("confirmPassword").setCustomValidity("Passwords do not match");
    document.getElementById("confirmPassword").reportValidity();
    return;
  }
  document.getElementById("confirmPassword").setCustomValidity("");
  closePasswordModal();
  showToast("Password updated");
});

document.getElementById("confirmPassword").addEventListener("input", event => {
  event.target.setCustomValidity("");
});

let confirmCallback = null;

function openConfirmModal(title, message, actionLabel, callback) {
  document.getElementById("confirmModalTitle").textContent = title;
  document.getElementById("confirmMessage").textContent = message;
  document.getElementById("confirmActionButton").textContent = actionLabel;
  confirmCallback = callback;
  document.getElementById("confirmModal").classList.add("open");
  document.getElementById("confirmModal").setAttribute("aria-hidden", "false");
}

function closeConfirmModal() {
  document.getElementById("confirmModal").classList.remove("open");
  document.getElementById("confirmModal").setAttribute("aria-hidden", "true");
  confirmCallback = null;
}

document.getElementById("cancelConfirmModal").addEventListener("click", closeConfirmModal);
document.getElementById("confirmModal").addEventListener("click", event => {
  if (event.target === event.currentTarget) closeConfirmModal();
});
document.getElementById("confirmActionButton").addEventListener("click", () => {
  const callback = confirmCallback;
  closeConfirmModal();
  if (callback) callback();
});

document.getElementById("closeAccountModal").addEventListener("click", closeAccountModal);
document.getElementById("cancelAccountModal").addEventListener("click", closeAccountModal);
document.getElementById("accountModal").addEventListener("click", event => {
  if (event.target === event.currentTarget) closeAccountModal();
});

document.getElementById("accountName").addEventListener("input", event => {
  const name = event.target.value.trim() || "Account";
  document.getElementById("accountAvatar").textContent = initials(name);
  document.getElementById("accountPreviewName").textContent = name;
});

document.getElementById("accountForm").addEventListener("submit", event => {
  event.preventDefault();
  const account = loadAccount();
  account.name = document.getElementById("accountName").value.trim();
  account.email = document.getElementById("accountEmail").value.trim();
  account.role = document.getElementById("accountRole").value;
  account.phone = document.getElementById("accountPhone").value.trim();
  saveAccount(account);
  applyAccount();
  closeAccountModal();
  showToast("Account updated");
});

document.getElementById("notificationButton").addEventListener("click", event => {
  event.stopPropagation();
  const menu = document.getElementById("notificationMenu");
  menu.classList.toggle("open");
  menu.setAttribute("aria-hidden", menu.classList.contains("open") ? "false" : "true");
});

document.getElementById("markReadButton").addEventListener("click", event => {
  event.stopPropagation();
  document.querySelector(".notification-dot").hidden = true;
  document.getElementById("notificationMenu").classList.remove("open");
  showToast("Notifications marked as read");
});

document.addEventListener("click", event => {
  if (!event.target.closest("#userCard")) {
    document.getElementById("accountMenu").classList.remove("open");
    document.getElementById("accountMenu").setAttribute("aria-hidden", "true");
    document.getElementById("userCard").setAttribute("aria-expanded", "false");
  }
  if (!event.target.closest(".top-actions")) document.getElementById("notificationMenu").classList.remove("open");
});

applyAccount();

render();
