const assert = require("assert");
const { processData } = require("./server");

const response = processData([
  "A->B",
  "A->C",
  "B->D",
  "C->E",
  "E->F",
  "X->Y",
  "Y->Z",
  "Z->X",
  "P->Q",
  "Q->R",
  "G->H",
  "G->H",
  "G->I",
  "hello",
  "1->2",
  "A->",
]);

assert.deepStrictEqual(response.invalid_entries, ["hello", "1->2", "A->"]);
assert.deepStrictEqual(response.duplicate_edges, ["G->H"]);
assert.deepStrictEqual(response.summary, {
  total_trees: 3,
  total_cycles: 1,
  largest_tree_root: "A",
});
assert.strictEqual(response.hierarchies[0].root, "A");
assert.strictEqual(response.hierarchies[0].depth, 4);
assert.strictEqual(response.hierarchies[1].root, "G");
assert.strictEqual(response.hierarchies[1].depth, 2);
assert.strictEqual(response.hierarchies[2].root, "P");
assert.strictEqual(response.hierarchies[2].depth, 3);
assert.strictEqual(response.hierarchies[3].root, "X");
assert.strictEqual(response.hierarchies[3].has_cycle, true);

const multiparent = processData(["A->D", "B->D", "B->C"]);
assert.deepStrictEqual(multiparent.hierarchies.map((item) => item.root), ["A", "B"]);
assert.deepStrictEqual(multiparent.hierarchies[0].tree, { A: { D: {} } });
assert.deepStrictEqual(multiparent.hierarchies[1].tree, { B: { C: {} } });

const trimmed = processData([" A->B ", "A->A", "", "A->B", "A->B"]);
assert.deepStrictEqual(trimmed.invalid_entries, ["A->A", ""]);
assert.deepStrictEqual(trimmed.duplicate_edges, ["A->B"]);

console.log("All tests passed");
