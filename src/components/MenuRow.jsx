import React from 'react';

import Button from './Button.jsx';

export default ({buttonNames}) => (
  <div className='row buttons'>
    {buttonNames.map(name => <Button name={name} />)}
  </div>
);