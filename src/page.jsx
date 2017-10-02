import ReactDOM from 'react-dom';
import React from 'react';

import Menu from './components/Menu.jsx';

import style from './styles/main.scss';


export default function() {
  const app = document.createElement('div');

  document.body.appendChild(app);

  ReactDOM.render(
    <Menu buttonNames={['a', 'b', 'C', 'd']}/>,
    app
  );
}