import { ChangeEvent } from "react";
import { Workbook } from "exceljs";

interface Props {
  setColumns: (columns: string[][]) => void;
  columns: string[][];
}

const UploadFile = ({ setColumns, columns }: Props) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const wb = new Workbook();
      const reader = new FileReader();

      reader.readAsArrayBuffer(file);

      reader.onload = () => {
        const buffer = reader.result as ArrayBuffer;

        wb.xlsx.load(buffer).then((workbook) => {
          const newColumns: string[][] = [];

          workbook.eachSheet((sheet) => {
            for (let i = 0; i < sheet.actualColumnCount; i++) {
              const column = sheet.getColumn(i + 1)?.values;

              if (column && column.length) {
                newColumns.push(column as string[]);
              }
            }
          });

          setColumns([...columns, ...newColumns]);
        });
      };
    }
  };

  return <input type="file" onChange={handleChange} />;
};

export default UploadFile;
