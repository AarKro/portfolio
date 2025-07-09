import { FC, PropsWithChildren } from 'react';
import './Bubble.css';

type BubbleProps = {
};

export const Bubble: FC<PropsWithChildren<BubbleProps>> = ({ children }) => {
  
  return (
    <div className='bubble-container'>
      <div className='bubble top'>
        {children}
      </div>
      <div className='bubble bottom'>
      </div>
    </div>
  );
};

export default Bubble;