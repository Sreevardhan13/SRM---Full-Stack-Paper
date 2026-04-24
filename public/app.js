const sampleInput = `A->B, A->C, B->D, C->E, E->F
X->Y, Y->Z, Z->X
P->Q, Q->R
G->H, G->H, G->I
hello, 1->2, A->`;

const nodeInput = document.querySelector("#nodeInput");
const submitButton = document.querySelector("#submitButton");
const sampleButton = document.querySelector("#sampleButton");
const statusText = document.querySelector("#statusText");
const summaryGrid = document.querySelector("#summaryGrid");
const hierarchyList = document.querySelector("#hierarchyList");
const rawResponse = document.querySelector("#rawResponse");

function parseInput(value) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function renderTreeObject(tree) {
  const entries = Object.entries(tree);
  if (entries.length === 0) return "";

  const items = entries
    .map(([node, children]) => {
      const childMarkup = renderTreeObject(children);
      return `<li><span>${node}</span>${childMarkup}</li>`;
    })
    .join("");

  return `<ul>${items}</ul>`;
}

function renderResponse(data) {
  summaryGrid.innerHTML = [
    ["Total trees", data.summary.total_trees],
    ["Total cycles", data.summary.total_cycles],
    ["Largest root", data.summary.largest_tree_root || "-"],
  ]
    .map(
      ([label, value]) => `
        <article class="summary-card">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `,
    )
    .join("");

  hierarchyList.innerHTML = data.hierarchies
    .map((hierarchy) => {
      const badge = hierarchy.has_cycle
        ? `<span class="badge cycle">Cycle</span>`
        : `<span class="badge">Depth ${hierarchy.depth}</span>`;
      const treeMarkup = hierarchy.has_cycle
        ? `<p class="empty-tree">Cycle detected. Tree output intentionally empty.</p>`
        : `<div class="tree-view">${renderTreeObject(hierarchy.tree)}</div>`;

      return `
        <article class="hierarchy-card">
          <div class="card-title">
            <h3>Root ${hierarchy.root}</h3>
            ${badge}
          </div>
          ${treeMarkup}
        </article>
      `;
    })
    .join("");

  rawResponse.textContent = JSON.stringify(data, null, 2);
}

async function submitNodes() {
  const data = parseInput(nodeInput.value);
  submitButton.disabled = true;
  statusText.classList.remove("error");
  statusText.textContent = "Calling /bfhl...";

  try {
    const response = await fetch("/bfhl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "API request failed.");
    }

    renderResponse(payload);
    statusText.textContent = "Response received";
  } catch (error) {
    statusText.classList.add("error");
    statusText.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
}

sampleButton.addEventListener("click", () => {
  nodeInput.value = sampleInput;
});

submitButton.addEventListener("click", submitNodes);

submitNodes();
