import React from 'react';

import MenuRow from './MenuRow.jsx';

export default ({buttonNames, maxWidth = Infinity}) => {
  
  if (maxWidth <= 0)
    throw new Error('maxWidth must be a positive number');
  
  const rows = [];
  
  for (let i = 0; i < buttonNames.length; ++i) {
    
    if (i % maxWidth === 0) {
      rows.push([]);
    }
    
    rows[rows.length-1].push(buttonNames[i]);
    
  }
  
  return (
    <div className='menu top no-click'>
      {rows.map(row => <MenuRow buttonNames={row} />)}
    </div>
        
  );
}