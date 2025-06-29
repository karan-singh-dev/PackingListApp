import XLSX from "xlsx";
import RNFS from "react-native-fs";
import Share from "react-native-share";
import { Platform } from "react-native";

export const useExcelExporter = () => {
  const generateExcelFile = async ({ data, headers, fileName, sheetName }) => {
    try {
      // Step 1: Group data by case_no_start - case_no_end
      const grouped = {};
      data.forEach((item) => {
        const key = `${item.case_no_start}-${item.case_no_end}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });

      // Step 2: Flatten grouped data into sheet format
      const sharedFields = [
        "case_no_start",
        "case_no_end",
        "total_case",
        "gross_wt",
        "total_gross_wt",
        "length",
        "width",
        "height",
        "cbm",
      ];

      const sheetData = [headers.map((h) => h.label)];
      const merges = [];
      let currentRow = 1;

      for (const groupRows of Object.values(grouped)) {
        const rowspan = groupRows.length;

        groupRows.forEach((item, rowIndex) => {
          const row = headers.map(({ key }, colIndex) => {
            if (sharedFields.includes(key)) {
              return rowIndex === 0 ? item[key] : null;
            }
            return item[key];
          });

          sheetData.push(row);

          if (rowIndex === 0 && rowspan > 1) {
            headers.forEach(({ key }, colIndex) => {
              if (sharedFields.includes(key)) {
                merges.push({
                  s: { r: currentRow, c: colIndex },
                  e: { r: currentRow + rowspan - 1, c: colIndex },
                });
              }
            });
          }

          currentRow++;
        });
      }

      // Step 3: Create worksheet with merges
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws["!merges"] = merges;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");

      const wbout = XLSX.write(wb, { type: "binary", bookType: "xlsx" });

      const path = `${RNFS.DocumentDirectoryPath}/${fileName}.xlsx`;
      await RNFS.writeFile(path, wbout, "ascii");

      return path;
    } catch (error) {
      console.error("Error creating Excel file:", error);
      return null;
    }
  };

  const shareExcelFile = async (filePath, title) => {
    try {
      await Share.open({
        title: title || "Exported File",
        url: Platform.OS === "android" ? `file://${filePath}` : filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    } catch (error) {
      console.error("Error sharing file:", error);
    }
  };

  return { generateExcelFile, shareExcelFile };
};
