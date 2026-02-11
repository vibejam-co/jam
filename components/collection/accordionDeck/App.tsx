
import React from 'react';
import AccordionDeck from './components/AccordionDeck';

const App: React.FC = () => {
  return (
    <main className="min-h-screen w-full bg-black text-white selection:bg-white selection:text-black">
      <AccordionDeck />
    </main>
  );
};

export default App;
