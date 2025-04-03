import MediaPlayer from './components/MediaPlayer';
import { Card } from "./components/ui/card"
import './App.css';

function App() {
  return (
    <div className="App">
      <Card className="w-[900px]">
          <MediaPlayer/>
      </Card>
    </div>
  );
}

export default App;
