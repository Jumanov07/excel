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

  const [selectedColumns, setSelectedColumns] = useState<{
    first: string[];
    second: string[];
  }>({
    first: [],
    second: [],
  });

  const [embodiedRows, setEmbodiedRows] = useState<
    { id: string; value: string }[]
  >([]);

  const [newColumns, setNewColumns] = useState<
    {
      id: string;
      files: string[];
      columns: string[];
      types: string[];
    }[]
  >([]);

  const [files, setFiles] = useState<string[]>([]);
  const [columnId, setColumnId] = useState<string>("");

  const [value, setValue] = useState<{ [key: string]: string }>({});
  const [valueColumn, setValueColumn] = useState<{ [key: string]: string }>({});
  const [type, setType] = useState<{ [key: string]: string }>({});

  const [index, setIndex] = useState("");
  const [indexColumn, setIndexColumn] = useState("");
  const [typeIndex, setTypeIndex] = useState("");

  const [currentFile, setCurrentFile] = useState("0");
  const [currentColumns, setCurrentColumns] = useState<
    { id: string; value: string }[]
  >([]);

  const firstSelect = firstFileColumns.map((column) => column[1]);
  const secondSelect = secondFileColumns.map((column) => column[1]);

  const changeFirstSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const findedColumn = firstFileColumns.find(
      (column) => column[1] === e.target.value
    );

    if (findedColumn) {
      setSelectedColumns({
        first: findedColumn,
        second: selectedColumns.second,
      });
    }
  };

  const changeSecondSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const findedColumn = secondFileColumns.find(
      (column) => column[1] === e.target.value
    );

    if (findedColumn) {
      setSelectedColumns({
        first: selectedColumns.first,
        second: findedColumn,
      });
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
    setEmbodiedRows(
      embodiedRows.map((row) => {
        if (columnId === row.id) {
          if (debounceValue) {
            if (type[typeIndex] === "Text") {
              row.value = row.value + ` ${debounceValue}`;
            } else {
              row.value = row.value + +debounceValue;
            }
          }
        }

        return row;
      })
    );
  }, [debounceValue]);

  useEffect(() => {
    setCurrentColumns(
      currentColumns.map((row) => {
        if (row.id === columnId) {
          if (debounceValueColumn) {
            row.value = debounceValueColumn;
          }
        }

        return row;
      })
    );
  }, [debounceValueColumn]);

  const allColumns = [...firstFileColumns, ...secondFileColumns];

  const generateExcel = useCallback(() => {
    const filteredThead = currentColumns
      .map((column) => column.value)
      .filter((th) => th !== undefined);

    const filteredRow = embodiedRows
      .map((row) => row.value)
      .filter((cell) => cell !== undefined);

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

  const isEquals = selectedColumns.first.some((cell) =>
    selectedColumns.second.includes(cell)
  );

  const saveHandler = () => {
    if (selectedColumns.first.length && selectedColumns.second.length) {
      if (isEquals) {
        if (embodiedRows.length > 0) {
          generateExcel();
        } else {
          alert("Selected columns!");
        }
      } else {
        alert("There are none like it!");
      }
    } else {
      alert("Selected files!");
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
        types: ["Text", "Formel"],
      };

      setNewColumns([...newColumns, column]);
    } else {
      alert(`Only ${allColumns.length} columns!`);
    }
  };

  const changeColumn = (e: ChangeEvent<HTMLSelectElement>) => {
    const index = e.target.value;
    const columnId = e.target.id;

    setColumnId(columnId);

    const current = {
      id: columnId,
      value:
        currentFile === "1"
          ? secondFileRows[0].row[+index]
          : currentFile === "0"
          ? firstFileRows[0].row[+index]
          : "",
    };

    const updatedColumns = [...currentColumns];

    const columnIndex = updatedColumns.findIndex(
      (column) => column.id === current.id
    );

    if (columnIndex !== -1) {
      updatedColumns[columnIndex] = current;
    } else {
      updatedColumns.push(current);
    }

    setCurrentColumns(updatedColumns);

    const firstColumnIndexes: number[] = [];
    const secondColumnIndexes: number[] = [];

    selectedColumns.first.forEach((cell, index) => {
      if (selectedColumns.second.includes(cell)) {
        firstColumnIndexes.push(index);
      }
    });

    selectedColumns.second.forEach((cell, index) => {
      if (selectedColumns.first.includes(cell)) {
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
      const current = {
        id: columnId,
        value:
          currentFile === "1"
            ? secondFindedRow.row[+index]
            : currentFile === "0"
            ? firstFindedRow.row[+index]
            : "",
      };

      const updatedColumns = [...embodiedRows];

      const columnIndex = updatedColumns.findIndex(
        (column) => column.id === current.id
      );

      if (columnIndex !== -1) {
        updatedColumns[columnIndex] = current;
      } else {
        updatedColumns.push(current);
      }

      setEmbodiedRows(updatedColumns);
    }
  };

  const changeType = (e: ChangeEvent<HTMLSelectElement>, i: string) => {
    const newValue = e.target.value;

    setType((prevState) => ({
      ...prevState,
      [i]: newValue,
    }));

    setTypeIndex(i);
  };

  return (
    <div className="flex flex-col pl-40 pr-40">
      <div className="flex justify-center">
        <div className="flex justify-center items-center flex-col gap-10 w-fit">
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

          <div className="flex w-full">
            <div style={{ flex: 0.71 }}>
              <select
                className="w-40 border border-solid border-black bg-white rounded-md p-2"
                onChange={changeFirstSelect}
              >
                <option value="Nothing">Nothing</option>

                {firstSelect.map((title, i) => (
                  <option key={i} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </div>

            <select
              className="w-40 border border-solid border-black bg-white rounded-md p-2"
              onChange={changeSecondSelect}
            >
              <option value="Nothing">Nothing</option>

              {secondSelect.map((title, i) => (
                <option key={i} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedColumns.first.length &&
      selectedColumns.second.length > 1 &&
      isEquals ? (
        <div className="w-full flex justify-end mt-10 mb-5">
          <button
            className="bg-white font-bold text-blue-500 border-2 border-solid border-blue-500 p-3 pl-5 pr-5  rounded-md"
            onClick={addColumn}
          >
            +
          </button>
        </div>
      ) : (
        ""
      )}

      <table>
        {selectedColumns.first.length &&
        selectedColumns.second.length > 1 &&
        isEquals ? (
          <thead>
            <tr className="flex justify-evenly">
              <th className="font-medium flex-1">Source</th>
              <th className="font-medium flex-2">Column name from source</th>
              <th className="font-medium flex-1">Type</th>
              <th className="font-medium flex-1">Additional text or formel</th>
              <th className="font-medium flex-1">Target column name</th>
            </tr>
          </thead>
        ) : (
          ""
        )}

        <tbody className="flex flex-col justify-center items-center gap-5 mt-5">
          {newColumns.map((column, i) => (
            <tr key={i} className="flex items-center">
              <td className="mr-10">{i + 1})</td>

              <td className="mr-10">
                <select
                  className="border border-solid border-black bg-white rounded-md p-2"
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
              </td>

              <td className="mr-16">
                <select
                  className="w-52 border border-solid border-black bg-white rounded-md p-2"
                  onChange={changeColumn}
                  id={column.id}
                >
                  <option value="Nothing">Nothing</option>

                  {column.columns.map((column, i) => (
                    <option value={i + 1} key={i}>
                      {column}
                    </option>
                  ))}
                </select>
              </td>

              <td className="mr-6">
                <select
                  className="border border-solid border-black bg-white rounded-md p-2"
                  onChange={(e) => changeType(e, i.toString())}
                >
                  <option value="Nothing">Nothing</option>

                  {column.types.map((type, i) => (
                    <option value={type} key={i}>
                      {type}
                    </option>
                  ))}
                </select>
              </td>

              <td className="mr-10">
                <input
                  className="w-50 border border-solid border-black bg-white rounded-md p-2 text-black placeholder:text-black"
                  type={"text"}
                  placeholder={`Write your ${
                    type[i] === "Formel" ? "formel..." : "text..."
                  }`}
                  value={value[i] || ""}
                  onChange={(e) => changeInput(e, i.toString())}
                />
              </td>

              <td>
                <input
                  className="w-40 border border-solid border-black bg-white rounded-md p-2 text-black placeholder:text-black"
                  type="text"
                  placeholder="Write your text..."
                  value={valueColumn[i] || ""}
                  onChange={(e) => changeInputColumn(e, i.toString())}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="w-full flex justify-end mt-10">
        <button
          className="bg-blue-500 text-white p-3 pl-5 pr-5  rounded-md"
          onClick={saveHandler}
        >
          Save as excel
        </button>
      </div>
    </div>
  );
};

export default App;
