import { strict as assert } from "node:assert";
import { pageChanged } from "./change_monitor.ts";

assert.equal(pageChanged("pricing\n", "pricing"), false);
assert.equal(pageChanged("pricing", "pricing updated"), true);
console.log("pageChanged decision test passed");
