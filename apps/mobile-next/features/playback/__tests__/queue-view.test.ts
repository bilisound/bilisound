import { orderQueue } from "../queue-view";

const queue = [
  { id: "a", uri: "" },
  { id: "b", uri: "" },
  { id: "c", uri: "" },
];

test("shuffle presentation retains canonical indexes for jump", () => {
  expect(orderQueue(queue, [2, 0, 1]).map(item => [item.track.id, item.canonicalIndex])).toEqual([
    ["c", 2],
    ["a", 0],
    ["b", 1],
  ]);
});

test.each([[0], [0, 0, 2], [0, 1, 9], [0, 1, -1]])("in-flight or invalid order falls back safely: %j", (...order) => {
  expect(orderQueue(queue, order).map(item => item.track.id)).toEqual(["a", "b", "c"]);
});
