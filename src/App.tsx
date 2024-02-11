import { useState } from "react";
import "./App.css";
import UploadFile from "./components/UploadFile";

const App = () => {
  const [firstFileColumns, setFirstFileColumns] = useState<string[][]>([]);

  console.log(firstFileColumns);

  return (
    <div>
      <UploadFile setColumns={setFirstFileColumns} columns={firstFileColumns} />
    </div>
  );
};

export default App;
