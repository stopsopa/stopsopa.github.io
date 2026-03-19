// printf pages/bookmarklets/gmail/extract.ts | node es.ts

// // to prevent
// Duplicate function implementation.ts(2393)
// function levenshtein(a: string, b: string): number (+1 overload)
//
// The error happens because TypeScript treats files without import or export as global scripts
export {};
<<<<<<< HEAD:pages/bookmarklets/gmail/extract.ts
=======

type ListType = ListTypeElement[];
>>>>>>> e27c28ee (gmail split pane):gmail/extract.ts

type MetaType = {
  title: string;
  nameSurname: string;
  email: string;
};

type ListTypeElement = MetaType & {
  el: HTMLElement;
};

<<<<<<< HEAD:pages/bookmarklets/gmail/extract.ts
type ListType = ListTypeElement[];

=======
>>>>>>> e27c28ee (gmail split pane):gmail/extract.ts
type FindOneType = {
  doNotThrowError?: boolean;
  parent?: HTMLElement;
};

function findOne(selector: string, options?: FindOneType): HTMLElement | null {
  const { doNotThrowError = false, parent = document } = options || {};

  const list = [...parent.querySelectorAll(selector)] as HTMLElement[];

  if (list.length === 1) {
    return list[0];
  }

  if (doNotThrowError) {
    return null;
  }
  throw new Error(`findOne(${selector}) found ${list.length} elements, should be just one`);
}

/**
 *
 * returns title, nameSurname, email of the opened email
 * for open which you see opened before you
 * no matter if in splitpane or standalone (when split pane is closed)
 * it returns title, .... as long as email is opened
 */
function openedEmail() {
  try {
    // this is for pane opened and closed to extract current title, name and email
    var h2 = findOne("h2[id][data-thread-perm-id]");

    var title = null;

    if (h2) {
      title = h2.innerText;
    }

    var user = findOne("h3 span[name][email]");

    var nameSurname = null;
    var email = null;

    if (user) {
      nameSurname = user.innerText as string;
      email = user.getAttribute("email") as string;
    }

    return {
      open: true,
      title,
      nameSurname,
      email,
    };
  } catch (e) {
    return { open: false };
  }
}

function clickOnTheList(meta: MetaType) {
  const { title, nameSurname, email } = meta;

  if (!title || !nameSurname || !email) {
    return false;
  }
  // I have to finish something here
  // I have to finish something here
  // I have to finish something here
  // I have to finish something here
  // I have to finish something here
  // I have to finish something here
}

/**
 * This function once it is given list of elments from the list it will extract title, email and nameSurname of each element
 */
function extractMetaFromListElements(elements: HTMLElement[] | NodeListOf<HTMLElement>): ListType {
  const arr = [...elements];

  function extractOne(el: HTMLElement, index: number): ListTypeElement | null {
    const id = el?.getAttribute("id");
    try {
      // there are two with name and email attribute in single row, so just find first
      const emailEl = el.querySelector("[name][email]");
      if (!emailEl) {
        console.log(`extractMetaFromListElements error: index ${index}, id ${id}, [name][email] not found`);
        return null;
      }

      // there are two elements with data-legacy-last-message-id and data-legacy-last-non-draft-message-id attributes in single row, so just find first
      const titleEl = el.querySelector(
        "[data-legacy-last-message-id][data-legacy-last-non-draft-message-id]"
      ) as HTMLElement | null;
      if (!titleEl) {
        console.log(
          `extractMetaFromListElements error: index ${index}, id ${id}, [data-legacy-last-message-id][data-legacy-last-non-draft-message-id] not found`
        );
        return null;
      }

      const title = titleEl.innerText;

      const email = emailEl.getAttribute("email");
      const nameSurname = emailEl.getAttribute("name");

      if (
        typeof title === "string" &&
        title.trim().length > 0 &&
        typeof email === "string" &&
        email.trim().length > 0 &&
        typeof nameSurname === "string" &&
        nameSurname.trim().length > 0
      ) {
        return {
          title,
          nameSurname,
          email,
          el,
        };
      }

      return null;
    } catch (e) {
      console.log(`extractMetaFromListElements error: index ${index}, id ${id}, ${e}`);
      return null;
    }
  }

  return arr.reduce((acc: ListType, el, index) => {
    const ex = extractOne(el, index);
    if (ex) {
      acc.push(ex);
    }
    return acc;
  }, []);
}

/**
 *
 * it works on the list from extractMetaFromListElements()
 * once it is passed that list and object extracted using openedEmail() it will find the best match
 */
function findElementOnTheListByLevenstein(
  list: ListType,
  { title, nameSurname, email }: MetaType
): ListTypeElement | null {
  if (list.length === 0) {
    return null;
  }

  if (typeof title !== "string" || typeof nameSurname !== "string" || typeof email !== "string") {
    return null;
  }

  let bestMatch = list[0];
  let minDistance = Infinity;

  for (const item of list) {
    const dTitle = levenshtein(item.title, title);
    const dName = levenshtein(item.nameSurname, nameSurname);
    const dEmail = levenshtein(item.email, email);

    const totalDistance = dTitle + dName + dEmail;

    if (totalDistance < minDistance) {
      minDistance = totalDistance;
      bestMatch = item;
    }
  }

  return bestMatch;
}

function listChildrenClick(el: HTMLElement) {
  try {
    click_v3(el);
  } catch (e) {
    console.log(`listChildrenClick error: ${e}`);
  }
}

function detectPaneOpen() {
  const topParent = findOne("[jslog] > div[jsaction][jsname][jscontroller]");

  if (!topParent) {
    throw new Error(`detectPaneOpen error: topParent not found`);
  }

  const children = [...topParent.children] as HTMLElement[];

  if (children.length !== 3) {
    throw new Error(`detectPaneOpen error: children length is not 3`);
  }

  // parent element where list of emails is rendered
  const listParent = children[0];

  // div where email content is rendered when split pane is opened (two panels are visible)
  const emailRenderParent = children[children.length - 1];

  // it seems that opening and closing panel is reflected with flex-grow property. I'll use that to detect then
  const open = emailRenderParent.style.flexGrow !== "0";

  let listChildren: HTMLElement[] = [];
  if (listParent) {
    listChildren = Array.from(listParent.querySelectorAll("tbody > tr")) as HTMLElement[];
  }

  return {
    topParent,
    children3: children,
    listParent,
    listChildren: extractMetaFromListElements(listChildren),
    // listChildren,
    findChildByMeta: (meta: MetaType) => {
      const { title, nameSurname, email } = meta;
      const list = extractMetaFromListElements(listChildren);
      return findElementOnTheListByLevenstein(list, { title, nameSurname, email });
    },
    emailRenderParent,
    open,
  };
}
function click_v3(element: HTMLElement) {
  const options = { bubbles: true, cancelable: true, view: window };
  element.dispatchEvent(new MouseEvent("mousedown", options));
  element.dispatchEvent(new MouseEvent("mouseup", options));
  element.dispatchEvent(new MouseEvent("click", options));
}
// finds all buttons which we will need
/**
 *
 * Call it always fresh
 * buttonsElements().backToTheListButtonClick() - clicks on the back to the list button
 * buttonsElements().toggleSplitPaneModeButtonClick() - clicks on the toggle split pane mode button
 */
function buttonsElements() {
  let backToTheListButton = findOne('[title="Back to Inbox"]', { doNotThrowError: true });
  if (!backToTheListButton) {
    backToTheListButton = findOne('[aria-label="Back to Inbox"]', { doNotThrowError: true });
  }

  const toggleSplitPaneModeButton = findOne('[aria-label="Toggle split pane mode"]', { doNotThrowError: true });

  // console.log("buttons: ", {
  //   backToTheListButton,
  //   toggleSplitPaneModeButton,
  // });

  return {
    backToTheListButton,
    toggleSplitPaneModeButton,
    backToTheListButtonClick: () => {
      try {
        // console.log("debug", {
        //   backToTheListButton,
        //   children: backToTheListButton?.children,
        // });
        click_v3(backToTheListButton?.children?.[0] as HTMLElement);
      } catch (e) {
        console.log(`buttonElement.backToTheListButtonClick error: ${e}`);
      }
    },
    toggleSplitPaneModeButtonClick: () => {
      console.log("toggleSplitPaneModeButtonClick", {
        toggleSplitPaneModeButton,
      });
      try {
        click_v3(toggleSplitPaneModeButton as HTMLElement);
      } catch (e) {
        console.log(`buttonElement.toggleSplitPaneModeButtonClick error: ${e}`);
      }
    },
  };
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // delete
        dp[i][j - 1] + 1, // insert
        dp[i - 1][j - 1] + cost // substitute
      );
    }
  }

  return dp[a.length][b.length];
}

{
  const buttons = buttonsElements();

  buttonsElements()?.backToTheListButtonClick();

  let lastOpenedEmail = null;
  window.addEventListener("keydown", (e) => {
    if (e.shiftKey) {
      const currentMeta = openedEmail();

      if (!currentMeta?.open) {
        console.log(`openedEmail() - no open email right now`);
        return;
      }

      lastOpenedEmail = currentMeta;

      if (e.key === "ArrowRight") {
        const paneOpen = detectPaneOpen()?.open;

        console.log("Shift + ArrowRight pressed", paneOpen, lastOpenedEmail);

        if (!paneOpen) {
          buttonsElements()?.backToTheListButtonClick();

          buttonsElements()?.toggleSplitPaneModeButtonClick();

          // const found = findElementOnTheListByLevenstein(data.listChildren, lastOpenedEmail as MetaType);
          // if (found) {
          //   listChildrenClick(found.el);
          // } else {
          //   console.log("shift + left arrow error: findElementOnTheListByLevenstein() not found");
          // }
        }
      }
      if (e.key === "ArrowLeft") {
        const paneOpen = detectPaneOpen()?.open;

        console.log("Shift + ArrowLeft pressed", paneOpen, lastOpenedEmail);

        if (paneOpen) {
          buttons.toggleSplitPaneModeButtonClick();

          const data = detectPaneOpen();

          if (data?.listChildren && data.listChildren.length > 0) {
            const found = findElementOnTheListByLevenstein(data.listChildren, lastOpenedEmail as MetaType);
            if (found) {
              listChildrenClick(found.el);
            } else {
              console.log("shift + left arrow error: findElementOnTheListByLevenstein() not found");
            }
          }
        }
      }
    }
  });
}

// var k = buttonsElements();
// console.log(k);
