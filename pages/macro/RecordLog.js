import delay from "nlab/delay.js";

/**
 * tool.list()
 *   to see what is put to macro stack for play
 * console.log(JSON.stringify(tool.list().list, null, 4))
 * 
 * window.debug = true
 *   to slow down play feature
 *   look to console when this is turned on, it will print first what it will do after
 * 
 * 
 *  
 * tool.injectList([["_delegation_typefind",{"needle":"ujm","wrap":true,"caseSensitive":false,"wholeWord":false,"regExp":false}],["gotowordleft"],"-",["gotowordright"],"-",["findnext"],["gotowordleft"],"-",["gotowordright"],"-",["_delegation_typefind",{"needle":"yhn","wrap":true,"caseSensitive":false,"wholeWord":false,"regExp":false}],["gotowordleft"],"-",["gotowordright"],"-",["gotolinestart"],["selectwordright"],["copy"],["gotowordright"],["paste"]," ",["golinedown"],["gotolinestart"]])
 * window.debug = true;
 * 
 * [
    [
        "_delegation_typefind",
        {
            "needle": "ujm",
            "wrap": true,
            "caseSensitive": false,
            "wholeWord": false,
            "regExp": false
        }
    ],
    [
        "gotowordleft"
    ],
    "-",
    [
        "gotowordright"
    ],
    "-",
    [
        "findnext"
    ],
    [
        "gotowordleft"
    ],
    "-",
    [
        "gotowordright"
    ],
    "-",
    [
        "_delegation_typefind",
        {
            "needle": "yhn",
            "wrap": true,
            "caseSensitive": false,
            "wholeWord": false,
            "regExp": false
        }
    ],
    [
        "gotowordleft"
    ],
    "-",
    [
        "gotowordright"
    ],
    "-",
    [
        "gotolinestart"
    ],
    [
        "selectwordright"
    ],
    [
        "copy"
    ],
    [
        "gotowordright"
    ],
    [
        "paste"
    ],
    " ",
    [
        "golinedown"
    ],
    [
        "gotolinestart"
    ]
]
 * 
 * 
 * test data for editor:

aaa abc ujm ddd ujm yhn ol end
bbb abc ujm ddd ujm yhn ol end
ccc ujm ddd ujm yhn ol end
ddd abc ujm ujm ol yhn end
eee ujm ol  ujm yhn

zzz abc ujm ddd  ujm yhn ol end

 */

const log = console.log;

let list = [];
let prevPos = null;
let editor;
let stopAdding = false;

let clipboard = "";

const tool = {
  injectList: (newList) => {
    list = newList;
  },
  reset: () => {
    tool.injectList([]); // use injectList because I don't wan't to be treeshaken
    stopAdding = false;
  },
  focusedEditor: (ed) => (editor = ed),
  position: (pos) => (prevPos = pos),
  play: async () => {
    stopAdding = true;
    if (!editor) {
      return log("skipping play, no editor set");
    }

    editor.focus();

    for (let [i, command] of list.entries()) {
      if (window.debug) {
        log(JSON.stringify(command));

        await delay(3000);
      }
      if (typeof command === "string") {
        log(`typing >${command}<`);
        Array.from(command).forEach((letter) => {
          log(`letter >${letter}<`);
          editor.execCommand("insertstring", letter);
        });
      } else {
        switch (command[0]) {
          case "_delegation_typefind":
            {
              const { needle, ...rest } = command[1];
              log("triggering find", JSON.stringify([needle, rest]));

              // editor.execCommand("find", command[1]);
              editor.find(needle, rest);
            }

            break;
          case "findnext":
            {
              const copy = Array.from(list);

              const slice = copy.slice(0, i + 1);

              // log("find ------ slice", JSON.stringify(slice, null, 4));

              slice.reverse();

              // log("reverse", JSON.stringify(slice, null, 4));

              const lastFindType = slice.find((x) => Array.isArray(x) && x[0] === "_delegation_typefind");

              // log(`findnext`, JSON.stringify(lastFindType, null, 4));

              const { needle, ...rest } = lastFindType[1];

              editor.find(needle, rest);
            }
            break;
          case "copy":
            clipboard = editor.getSelectedText();
            log(`copy >${clipboard}<`);
            break;
          case "paste":
            log(`paste >${clipboard}<`, JSON.stringify(tool.list(), null, 4));
            if (typeof clipboard === "string" && clipboard.length > 0) {
              editor.execCommand("paste", clipboard);
            }
            break;
          default:
            if (command.length === 1) {
              editor.execCommand(command[0]);
            } else {
              editor.execCommand(command[0], command[1]);
            }
            break;
        }
      }
    }
  },
  add: (e, prevPos) => {
    // more: https://github.com/ajaxorg/ace/wiki/Embedding---API#api

    // ed().searchBox.isFocused();

    // ed().execCommand("find", {
    //   needle: "zz",
    //   wrap: true,
    //   caseSensitive: false,
    //   wholeWord: false,
    //   regExp: false,
    // });

    // editor.find("zz", {
    //   wrap: true,
    //   caseSensitive: false,
    //   wholeWord: false,
    //   regExp: false,
    // });

    if (stopAdding) {
      return log("stopAdding is active");
    }
    const {
      command: { name },
      args,
    } = e;

    log("add", e, "name:", name, "args:", args);

    switch (name) {
      case "insertstring":
        {
          let last = list.at(-1);
          if (typeof last === "string") {
            last = list.pop();
            last += args;
            list.push(last);
          } else {
            list.push(args);
          }
        }
        break;
      case "gotoleft":
      case "golineup":
      case "golinedown":
      case "gotoright":
      case "gotowordleft":
      case "gotowordright":
      case "gotolinestart":
      case "gotolineend":

      case "selectright":
      case "selectleft":
      case "selectwordleft":
      case "selectwordright":
      case "selectlineend":
      case "selectlinestart":
      case "findnext":
      case "del":
      case "backspace":
        list.push([name]);
        break;
      case "_delegation_typefind":
        {
          let last = list.at(-1);
          if (Array.isArray(last) && last[0] === "_delegation_typefind") {
            log("last is _delegation_typefind", last, "args", args);
            last = list.pop();
            last = ["_delegation_typefind", args];
            list.push(last);
          } else {
            log("last is NOT _delegation_typefind", last, "args", args);
            list.push(["_delegation_typefind", args]);
          }
        }
        break;
      case "copy":
        log(`change clipboard on record >${editor.getSelectedText()}<`);
        clipboard = editor.getSelectedText();
        // copy in case if we would just paste from that point

        list.push([name]);
        break;
      case "paste":
        list.push([name]);
        break;
      default:
        log(`RecordLog.js error: unhandled: ${name}`);
        break;
    }
  },
  list: () => {
    return {
      list,
      clipboard,
    };
  },
};

window.tool = tool;

export default tool;
