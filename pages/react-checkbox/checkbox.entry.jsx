
import React, { useEffect, useState } from 'react';

import { render } from 'react-dom';

import log from 'inspc';

const {serializeError, deserializeError} = require('serialize-error');

const Main = () => {

  const [ check, setCheck ] = useState(false);

  return (
    <table width="80%">
      <tbody>
      <tr>
        <td width="50%">


          <label>
            <input type="checkbox"/>
            foo foo foo foo foo foo
          </label>

          <br />

          <label>
            <input type="checkbox"/>
            foo foo foo foo foo foo
          </label>

          <br />

          <label>
            <NoInput value={check === 'foo'} onChange={() => setCheck('foo')}/>
            foo foo foo foo foo foo
          </label>

          <br />

          <label>
            <NoInput value={check === 'bar'} onChange={() => setCheck('bar')}/>
            bar bar bar bar bar bar
          </label>

          <br />

          <label>
            <input type="checkbox"/>
            foo foo foo foo foo foo
          </label>

          <br />

          <label>
            <input type="checkbox"/>
            foo foo foo foo foo foo
          </label>

        </td>
        <td>


          <label>
            <input type="radio"/>
            foo foo foo foo foo foo
          </label>

          <br />

          <label>
            <input type="radio"/>
            foo foo foo foo foo foo
          </label>

          <br />

          <label>
            <NoInput value={check === 'foo'} onChange={() => setCheck('foo')} className="radio"/>
            foo foo foo foo foo foo
          </label>

          <br />

          <label>
            <NoInput value={check === 'bar'} onChange={() => setCheck('bar')} className="radio"/>
            bar bar bar bar bar bar
          </label>

          <br />

          <label>
            <input type="radio"/>
            foo foo foo foo foo foo
          </label>

          <br />

          <NoInput value={check === 'foo'} onChange={() => setCheck('foo')} className="radio">foo foo foo foo foo foo</NoInput>

          <br />

          <NoInput value={check === 'bar'} onChange={() => setCheck('bar')} className="radio">bar bar bar bar bar bar</NoInput>


          <br />

          <label>
            <input type="radio"/>
            foo foo foo foo foo foo
          </label>

          <br />

          <NoInput value={check === 'foo'} onChange={() => setCheck('foo')} className="radio" before>foo foo foo foo foo foo</NoInput>

          <br />

          <NoInput value={check === 'bar'} onChange={() => setCheck('bar')} className="radio" before>bar bar bar bar bar bar</NoInput>

          <br />

          <label>
            <input type="radio"/>
            foo foo foo foo foo foo
          </label>

        </td>
      </tr>
      </tbody>






    </table>
  )
}

render(
  <Main />,
  document.getElementById('app')
);

function NoInput({
  value,
  onChange,
  className,
  children,
  before,
  props1,
  props2,
  props3,
  propslabel,
}) {

  const cls = ['noinput-checkbox'];

  if (value) {

    cls.push('checked');
  }

  if (typeof className === 'string') {

    cls.push(className);
  }

  const hasChildren = (typeof children !== 'undefined');

  const component = (
    <div className={cls.join(' ')} {...props1}>
      <div
        tabindex="0"
        onClick={onChange}
        onKeyDown={onChange}
        {...props2}
      >
        <div {...props3}></div>
      </div>
    </div>
  )

  if (hasChildren) {

    if (before) {

      return <label onClick={onChange} {...propslabel}>{children}{component}</label>
    }

    return <label onClick={onChange} {...propslabel}>{component}{children}</label>
  }

  return component;
}

