
import React from 'react';
import AccordionDeck from './components/AccordionDeck';

interface AccordionDeckAppProps {
  forcedViewport?: 'mobile' | 'desktop';
}

const App: React.FC<AccordionDeckAppProps> = ({ forcedViewport }) => {
  return (
    <main className="min-h-screen w-full bg-black text-white selection:bg-white selection:text-black">
      <AccordionDeck forcedViewport={forcedViewport} />
    </main>
  );
};

export default App;
