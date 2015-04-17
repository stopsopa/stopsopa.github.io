// const { test, expect } = require("@playwright/test");
import { test, expect } from "@playwright/test";

/**
 * /bin/bash playwright.sh
 * PWDEBUG=1 /bin/bash playwright.sh
 * /bin/bash playwright.sh --target docker
 */
test.describe("adeeditor makro", () => {
  test("blueprint", async ({ page, browserName }) => {
    await page.goto(`/pages/macro/002multi_tabs/index.html?clicksecure`);

    const data = `
aaa abc ujm ddd ujm yhn ol end
bbb abc ujm ddd ujm yhn ol end
ccc ujm ddd ujm yhn ol end
ddd abc ujm ujm ol yhn end
eee ujm ol  ujm yhn

zzz abc ujm ddd  ujm yhn ol end

`;

    const makro = [
      [
        "_delegation_typefind",
        {
          needle: "ujm",
          wrap: true,
          caseSensitive: false,
          wholeWord: false,
          regExp: false,
        },
      ],
      ["gotowordleft"],
      "-",
      ["gotowordright"],
      "-",
      ["findnext"],
      ["gotowordleft"],
      "-",
      ["gotowordright"],
      "-",
      [
        "_delegation_typefind",
        {
          needle: "yhn",
          wrap: true,
          caseSensitive: false,
          wholeWord: false,
          regExp: false,
        },
      ],
      ["gotowordleft"],
      "-",
      ["gotowordright"],
      "-",
      ["gotolinestart"],
      ["selectwordright"],
      ["copy"],
      ["gotowordright"],
      ["paste"],
      " ",
      ["golinedown"],
      ["gotolinestart"],
    ];

    await page.evaluate(
      ({ data, makro }) => {
        return new Promise((resolve) => {
          (function execute() {
            try {
              window.editors.one.editor.setValue(data);

              window.editors.one.editor.selection.moveTo(0, 0);

              tool.injectList(makro);

              resolve(true);
            } catch (e) {
              setTimeout(() => execute(), 100);
            }
          })();
        });
      },
      { data, makro }
    );

    await page.keyboard.press("Meta+J"); // to focus on first ace editor

    await page.keyboard.press("Meta+R"); // run macro 6 times

    await page.keyboard.press("Meta+R");

    await page.keyboard.press("Meta+R");

    await page.keyboard.press("Meta+R");

    await page.keyboard.press("Meta+R");

    await page.keyboard.press("Meta+R");

    const contentAfterApplyingMacro = await page.evaluate(
      () => {
        return window.editors.one.editor.getValue();
      },
      { data, makro }
    );

    expect(contentAfterApplyingMacro).toEqual(`
aaa aaa abc -ujm- ddd -ujm- -yhn- ol end
bbb bbb abc -ujm- ddd -ujm- -yhn- ol end
ccc ccc -ujm- ddd -ujm- -yhn- ol end
ddd ddd abc -ujm- -ujm- ol -yhn- end
eee eee -ujm- ol  -ujm- -yhn-

zzz zzz abc -ujm- ddd  -ujm- -yhn- ol end

`);
  });
});
