
import React from 'react';
import AccordionDeck from './components/AccordionDeck';

interface AccordionDeckAppProps {
  forcedViewport?: 'mobile' | 'desktop';
}

const App: React.FC<AccordionDeckAppProps> = ({ forcedViewport }) => {
  const isEmbeddedViewport = forcedViewport === 'mobile' || forcedViewport === 'desktop';

  return (
    <main
      className={`w-full bg-black text-white selection:bg-white selection:text-black overflow-hidden ${
        isEmbeddedViewport ? 'h-full min-h-0' : 'min-h-screen'
      }`}
    >
      <AccordionDeck forcedViewport={forcedViewport} />
    </main>
  );
};

export default App;
