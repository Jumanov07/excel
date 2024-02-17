import { ChangeEvent, InputHTMLAttributes } from "react";
import { Workbook } from "exceljs";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  setColumns: (columns: string[][]) => void;
  setRows: (rows: { row: string[]; index: number }[]) => void;
  columns: string[][];
  files: string[];
  setFiles: (files: string[]) => void;
}

const UploadFile = ({
  setColumns,
  setRows,
  columns,
  files,
  setFiles,
  ...rest
}: Props) => {
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
          const newRows: { row: string[]; index: number }[] = [];

          workbook.eachSheet((sheet) => {
            setFiles([...files, sheet.name]);

            for (let i = 0; i < sheet.actualColumnCount; i++) {
              const column = sheet.getColumn(i + 1)?.values;

              if (column && column.length) {
                newColumns.push(column as string[]);
              }
            }

            sheet.eachRow((row, i) => {
              newRows.push({ row: row.values as string[], index: i });
            });
          });

          setColumns([...columns, ...newColumns]);
          setRows(newRows);
        });
      };
    }
  };

  return <input type="file" onChange={handleChange} {...rest} />;
};

export default UploadFile;
