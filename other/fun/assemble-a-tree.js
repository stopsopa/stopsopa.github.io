// https://codepen.io/stopsopa/pen/KKvvxXy?editors=0010

const {
  core: { describe, it, expect, run },
  enzyme: { mount },
  prettify
} = window.jestLite; // from: https://blog.codepen.io/2019/07/17/jest-on-codepen/

const list = [{ id: 1, parent: 4 },{ id: 2, parent: 3 },{ id: 3, parent: 4 },{ id: 4 },{ id: 5, parent: 4 },{ id: 6, parent: 4 },{ id: 7, parent: 9 },
              { id: 8, parent: 4 },{ id: 9, parent: 8 },{ id: 10, parent: 8 },{ id: 11, parent: 14 },{ id: 12, parent: 11 },{ id: 13, parent: 14 },{ id: 14, parent: 6 }];

/**
 * Asumptions:
 * - there is always one root object without 'parent' property
 * - all objects have it's place in the tree (there is no free elements)
 * Requirements: (and kinda a tip)
 * - don't copy objects, just reuse them
 * - introduce in objects having children additional property 'children' of type array containing children (reused) objects
 * - only two iterations are allowed to build and return full tree
 */
function getTree(list) {
  let tmp;
  const obj = {};
  let root;
  for (let i = 0, l = list.length ; i < l ; i += 1 ) {
    tmp = list[i];
    obj[tmp.id] = tmp;
    if ( ! tmp.parent ) {
      root = tmp;
    }
  }
  for (let i = 0, l = list.length ; i < l ; i += 1 ) {
    tmp = list[i];
    if (tmp.parent && obj[tmp.parent]) {
      if (Array.isArray(obj[tmp.parent].children)) {
        obj[tmp.parent].children.push(tmp);
      }
      else {
        obj[tmp.parent].children = [tmp];
      }
      delete tmp.parent;
    }
  }
  return root;
}
it("renders children", () => {

  expect(getTree(list)).toEqual({
    id:4,
    "children": [
      {id:1},
      {
        id:3,
        "children": [{id:2}]
      },
      {id:5},
      {
        id:6,
        "children": [
          {
            id:14,
            "children": [
              {
                id:11,
                "children": [{id:12}]
              },
              {id:13}
            ]
          }
        ]
      },
      {
        id:8,
        "children": [
          {
            id:9,
            "children": [{id:7}]
          },
          {id:10}
        ]
      }
    ]
  });
});
prettify.toHTML(run(), document.body);
