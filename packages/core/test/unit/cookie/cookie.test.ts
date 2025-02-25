/**
 * @vitest-environment jsdom
 */

import { assert, test } from "vitest";
import { cookie } from "@/main";

test("Add cookie", () => {
  cookie.set("test", "test");
  assert.equal(cookie.get("test"), "test");
});

test("Remove cookie", () => {
  cookie.remove("test");
  assert.equal(cookie.get("test"), null);
});

test("Add cookie with expires", () => {
  cookie.set("test", "test", { expires: 1000 });
  assert.equal(cookie.get("test"), "test");
  setTimeout(() => {
    assert.equal(cookie.get("test"), null);
  }, 1100);
});
