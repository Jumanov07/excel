/* eslint-disable react-hooks/exhaustive-deps */
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Workbook, Worksheet } from "exceljs";
import "./App.css";
import UploadFile from "./components/UploadFile";
import { useDebounce } from "use-debounce";

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

  const [newColumns, setNewColumns] = useState<
    {
      id: string;
      files: string[];
      columns: string[];
      types: string[];
    }[]
  >([]);

  const [files, setFiles] = useState<string[]>([]);

  const [value, setValue] = useState<{ [key: string]: string }>({});
  const [valueColumn, setValueColumn] = useState<{ [key: string]: string }>({});

  const [currentColumn, setCurrentColumn] = useState("");

  const [index, setIndex] = useState("");
  const [indexColumn, setIndexColumn] = useState("");

  const [currentFile, setCurrentFile] = useState("0");

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

  const changeInput = (e: ChangeEvent<HTMLInputElement>, i: string) => {
    const newValue = e.target.value;
    setValue((prevState) => ({
      ...prevState,
      [i]: newValue,
    }));

    setIndex(i);
  };

  const changeInputColumn = (e: ChangeEvent<HTMLInputElement>, i: string) => {
    const newValue = e.target.value;
    setValueColumn((prevState) => ({
      ...prevState,
      [i]: newValue,
    }));

    setIndexColumn(i);
  };

  const [debounceValueColumn] = useDebounce(valueColumn[+indexColumn], 2000);
  const [debounceValue] = useDebounce(value[+index], 2000);

  useEffect(() => {
    const current =
      currentFile === "0"
        ? firstFileRows
        : currentFile === "1"
        ? secondFileRows
        : [];

    const currentSet =
      currentFile === "0"
        ? setFirstFileRows
        : currentFile === "1"
        ? setSecondFileRows
        : setFirstFileRows;

    currentSet(
      current.map((row) => {
        if (row.index !== 1) {
          if (debounceValue) {
            row.row[+currentColumn] =
              row.row[+currentColumn] + ` ${debounceValue}`;
          }
        }

        return row;
      })
    );
  }, [currentColumn, debounceValue]);

  useEffect(() => {
    const current =
      currentFile === "0"
        ? firstFileRows
        : currentFile === "1"
        ? secondFileRows
        : [];

    const currentSet =
      currentFile === "0"
        ? setFirstFileRows
        : currentFile === "1"
        ? setSecondFileRows
        : setFirstFileRows;

    currentSet(
      current.map((row) => {
        if (row.index === 1) {
          if (debounceValueColumn) {
            row.row[+currentColumn] = debounceValueColumn;
          }
        }

        return row;
      })
    );
  }, [currentColumn, debounceValueColumn]);

  const allColumns = [...firstFileColumns, ...secondFileColumns];

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
      const newRow = worksheet.addRow(row);

      newRow.eachCell((cell) => {
        const desiredWidth = cell.value
          ? cell.value.toString().length * 1.2
          : 10;
        const column = worksheet.getColumn(cell.col);
        column.width = desiredWidth < 10 ? 10 : desiredWidth;
      });
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

  const changeFile = (e: ChangeEvent<HTMLSelectElement>) => {
    const columns =
      e.target.value === "0"
        ? firstSelect
        : e.target.value === "1"
        ? secondSelect
        : [];

    setNewColumns(
      newColumns.map((column) => {
        if (column.id === e.target.id) {
          column.columns = columns;
        }

        return column;
      })
    );

    setCurrentFile(e.target.value);
  };

  const addColumn = () => {
    if (allColumns.length > newColumns.length) {
      const column = {
        id: String(Math.random() * 100),
        files,
        columns: [],
        types: ["Text", "Number"],
      };

      setNewColumns([...newColumns, column]);

      setValue({});
      setValueColumn({});
    } else {
      alert(`Only ${allColumns.length} columns!`);
    }
  };

  const changeColumn = (e: ChangeEvent<HTMLSelectElement>) => {
    setCurrentColumn(e.target.value);
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
              files={files}
              setFiles={setFiles}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="second-uploader">Select the second file</label>

            <UploadFile
              id="second-uploader"
              setColumns={setSecondFileColumns}
              columns={secondFileColumns}
              setRows={setSecondFileRows}
              files={files}
              setFiles={setFiles}
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

      {selectedColumns.length > 1 ? (
        <>
          <button
            className="border-2 border-solid text-blue-500 border-blue-500   p-5 rounded-md m-10"
            onClick={addColumn}
          >
            +
          </button>

          <div className="flex gap-20">
            <p>Source</p>
            <p>Column</p>
            <p>Type</p>
            <p>Add text</p>
            <p>Change column</p>
          </div>
        </>
      ) : (
        ""
      )}

      <div className="flex flex-col gap-5">
        {newColumns.map((column, i) => (
          <div key={i} className="flex gap-5">
            <p>{i + 1}</p>

            <select
              className="bg-gray-300"
              onChange={changeFile}
              id={column.id}
            >
              <option value="Nothing">Nothing</option>

              {column.files.map((file, i) => (
                <option value={i} key={i}>
                  {file}
                </option>
              ))}
            </select>

            <select className="bg-gray-300" onChange={changeColumn}>
              <option value="Nothing">Nothing</option>

              {column.columns.map((column, i) => (
                <option value={i + 1} key={i}>
                  {column}
                </option>
              ))}
            </select>

            <select className="bg-gray-300">
              <option value="Nothing">Nothing</option>

              {column.types.map((type, i) => (
                <option value={type} key={i}>
                  {type}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="bg-slate-300"
              placeholder="change cell"
              value={value[i] || ""}
              onChange={(e) => changeInput(e, i.toString())}
            />

            <input
              type="text"
              className="bg-slate-300"
              placeholder="change column name"
              value={valueColumn[i] || ""}
              onChange={(e) => changeInputColumn(e, i.toString())}
            />
          </div>
        ))}
      </div>

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


