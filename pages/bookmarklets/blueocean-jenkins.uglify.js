
var url = 'https://domain.com/blue/organizations/jenkins/ZSRR%2Fmango%2Fseparate%2Fproject/detail/PR-67/12/pipeline';

var target = 'https://domain.com/job/ZSRR/job/mango/job/separate/job/project/view/change-requests/job/PR-67/12/console';

var log = console.log;

function box(content, opt) {

  if ( ! opt ) {

    opt = {};
  }

  var div = document.createElement('div');

  div.style.position = 'fixed';
  div.style.zIndex = '10000000';
  div.style.top = '20%';
  div.style.left = '50%';
  div.style.border = '1px solid gray';
  div.style.backgroundColor = 'white';
  div.style.transform = 'translate(-50%, -50%)';
  div.style.padding = '10px';
  opt.minHeight && (div.style.minHeight = opt.minHeight);
  div.style.cursor = 'pointer'

  div.innerText = String(content);

  document.body.appendChild(div);

  var close = function () {
    document.body.removeChild(div);
  };

  if (opt.autoclose) {

    setTimeout(close, Number.isInteger(opt.autoclose) ? opt.autoclose : 1000);
  }
  else {

    div.addEventListener('click', close);
  }
}

function transform(url) {

  var m = url.match(/^(https?:\/\/[^\/]+\/)(?:blue\/organizations\/jenkins\/)(.*?)\/detail\/(.*?)(?:\/[^\/]+)\/*$/);

  if ( ! Array.isArray(m) ||  m.length !== 4) {

    return box(`Can't disassemble input url`, {autoclose: 2000});
  }

  var d = decodeURIComponent(m[2]).replace(/([^\/]+\/?)/g, 'job/$1');

// {
//   l: 4,
//   m: [
//     'https://domain.com/blue/organizations/jenkins/ZSRR%2Fmango%2Fseparate%2Fproject/detail/PR-67/12/pipeline',
//     'https://domain.com/',
//     'ZSRR%2Fmango%2Fseparate%2Fproject',
//     'PR-67/12',
//     index: 0,
//     input: 'https://domain.com/blue/organizations/jenkins/ZSRR%2Fmango%2Fseparate%2Fproject/detail/PR-67/12/pipeline',
//     groups: undefined
//   ],
//   d: 'job/ZSRR/job/mango/job/separate/job/project'
// }

  location.href = `${m[1]}${d}/view/change-requests/job/${m[3]}/console`;
}

transform(location.href);