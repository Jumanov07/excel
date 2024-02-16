import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Workbook, Worksheet } from "exceljs";
import "./App.css";
import UploadFile from "./components/UploadFile";

const App = () => {
  const [firstFileColumns, setFirstFileColumns] = useState<string[][]>([]);
  const [secondFileColumns, setSecondFileColumns] = useState<string[][]>([]);

  const [firstFileRows, setFirstFileRows] = useState<
    { row: string[]; index: number }[]
  >([]);
  const [secondFileRows, setSecondFileRows] = useState<
    { row: string[]; index: number }[]
  >([]);

  const [selectedColumns, setSelectedColumns] = useState<string[][]>([]);

  const [embodiedRows, setEmbodiedRows] = useState<string[]>([]);

  const firstSelect = firstFileColumns.map((column) => column[1]);
  const secondSelect = secondFileColumns.map((column) => column[1]);

  const changeFirstSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const findedColumn = firstFileColumns.find(
      (column) => column[1] === e.target.value
    );

    if (findedColumn) {
      setSelectedColumns([...selectedColumns, findedColumn]);
    }
  };

  const changeSecondSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const findedColumn = secondFileColumns.find(
      (column) => column[1] === e.target.value
    );

    if (findedColumn) {
      setSelectedColumns([...selectedColumns, findedColumn]);
    }
  };

  const generateExcel = useCallback(() => {
    const filteredThead = [
      ...firstFileRows[0].row,
      ...secondFileRows[0].row,
    ].filter((th) => th !== undefined);

    const filteredRow = embodiedRows.filter((cell) => cell !== undefined);

    const data = [filteredThead, filteredRow];

    const workbook = new Workbook();

    const worksheet: Worksheet = workbook.addWorksheet("Sheet1");

    data.forEach((row) => {
      worksheet.addRow(row);
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Embodied.xlsx";
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  }, [embodiedRows, firstFileRows, secondFileRows]);

  useEffect(() => {
    if (embodiedRows.length > 0) {
      generateExcel();
    }
  }, [embodiedRows.length, generateExcel]);

  const saveHandler = () => {
    if (selectedColumns[0] && selectedColumns[1]) {
      const isEquals = selectedColumns[0].some((cell) =>
        selectedColumns[1].includes(cell)
      );

      if (isEquals) {
        const firstColumnIndexes: number[] = [];
        const secondColumnIndexes: number[] = [];

        selectedColumns[0].forEach((cell, index) => {
          if (selectedColumns[1].includes(cell)) {
            firstColumnIndexes.push(index);
          }
        });

        selectedColumns[1].forEach((cell, index) => {
          if (selectedColumns[0].includes(cell)) {
            secondColumnIndexes.push(index);
          }
        });

        const similarIndexes = [...firstColumnIndexes, ...secondColumnIndexes];

        const firstFindedRow = firstFileRows.find(
          ({ index }) => index === similarIndexes[0]
        );

        const secondFindedRow = secondFileRows.find(
          ({ index }) => index === similarIndexes[1]
        );

        if (firstFindedRow && secondFindedRow) {
          setEmbodiedRows([...firstFindedRow.row, ...secondFindedRow.row]);
        }
      }
    }
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="flex flex-col gap-10">
        <div className="flex gap-10">
          <div className="flex flex-col gap-2">
            <label htmlFor="first-uploader">Select the first file</label>

            <UploadFile
              id="first-uploader"
              setColumns={setFirstFileColumns}
              columns={firstFileColumns}
              setRows={setFirstFileRows}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="second-uploader">Select the second file</label>

            <UploadFile
              id="second-uploader"
              setColumns={setSecondFileColumns}
              columns={secondFileColumns}
              setRows={setSecondFileRows}
            />
          </div>
        </div>

        <div className="flex gap-40">
          <select className="w-40 bg-slate-300" onChange={changeFirstSelect}>
            <option value="Nothing">Nothing</option>

            {firstSelect.map((title, i) => (
              <option key={i} value={title}>
                {title}
              </option>
            ))}
          </select>

          <select className="w-40 bg-slate-300" onChange={changeSecondSelect}>
            <option value="Nothing">Nothing</option>

            {secondSelect.map((title, i) => (
              <option key={i} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        className="border-2 border-solid text-blue-500 border-blue-500   p-5 rounded-md m-10"
        onClick={saveHandler}
      >
        +
      </button>

      <button
        className="bg-blue-500 text-white p-5 rounded-md m-10"
        onClick={saveHandler}
      >
        Save as excel
      </button>
    </div>
  );
};

export default App;
