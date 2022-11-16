import { NextUIProvider, Text } from '@nextui-org/react';

import './App.css';
import Staking from './components/staking';

function App() {
  return (
    <NextUIProvider>
      <div className="App">
        <Text 
          h1
          css={{
            textGradient: "45deg, $blue600 -20%, $pink600 50%",
          }}
        >
          IoTeX Web Staking
        </Text>
        <Staking />
      </div>
    </NextUIProvider>
  );
}

export default App;
