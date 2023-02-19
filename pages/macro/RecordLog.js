import delay from "nlab/delay";
import { async } from "regenerator-runtime";

const log = console.log;

let list = [];
let prevPos = null;
let editor;
let stopAdding = false;

function dec(e) {
  return {
    // command:
  };
}

let clipboard = "";

const tool = {
  reset: () => {
    list = [];
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

    for (let command of list) {
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
  add: (curPos, e) => {
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
    log("add", prevPos, curPos, e, "name:", name, "args:", args);

    switch (name) {
      case "insertstring":
        let last = list.at(-1);
        if (typeof last === "string") {
          last = list.pop();
          last += args;
          list.push(last);
        } else {
          list.push(args);
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

      case "del":
      case "backspace":
        list.push([name]);
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
