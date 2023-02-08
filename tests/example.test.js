/* eslint-disable import/no-unresolved */

// Import the test package and use it to create a test
const test = require("ava").default;

// creation of a test case with the name "Test to pass" and the function to be tested
test("Test to pass", (t) => {
  t.pass();
});
// creation of a test case with the name "Test value" and the function to be tested
test("Test value", async (t) => {
  const a = 1;
  t.is(a + 1, 2);
});

//declaration of a function that sums two numbers
const sum = (a, b) => a + b;

test("Sum of 2 numbers", (t) => {
  t.plan(2);
  t.pass("this assertion passed");
  t.is(sum(1, 2), 3);
});
