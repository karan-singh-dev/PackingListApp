import XLSX from "xlsx";
import RNFS from "react-native-fs";
import Share from "react-native-share";
import { Platform } from "react-native";

export const useExcelExporter = () => {
  const generateExcelFile = async ({ data, headers, fileName, sheetName }) => {
    try {
      const grouped = {};
      data.forEach((item) => {
        const key = `${item.case_no_start}-${item.case_no_end}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });

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

      // Styled header row
      const sheetData = [
        headers.map((h) => ({
          v: h.label,
          s: {
            fill: { fgColor: { rgb: "FF0000" } }, 
            font: { bold: true, color: { rgb: "FF0000" } }, 
            alignment: { horizontal: "center", vertical: "center" },
          },
        })),
      ];

      const merges = [];
      let currentRow = 1;

      for (const groupRows of Object.values(grouped)) {
        const rowspan = groupRows.length;

        groupRows.forEach((item, rowIndex) => {
          const row = headers.map(({ key }) => {
            if (sharedFields.includes(key)) {
              return rowIndex === 0 ? (item[key] != null ? item[key].toString() : "") : null;
            }
            return item[key] != null ? item[key].toString() : "";
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

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws["!merges"] = merges;

      ws["!freeze"] = { xSplit: 0, ySplit: 1 };

      const colWidths = headers.map((h) => ({ wpx: h.width || 100 }));
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
4
      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

      const path = `${RNFS.DownloadDirectoryPath}/${fileName}.xlsx`;
      console.log("Saving to path:", path);
      await RNFS.writeFile(path, wbout, "base64");

      const exists = await RNFS.exists(path);
      console.log(`File exists: ${exists}`);
      if (!exists) {
        console.warn("File not found after saving");
        return null;
      }

      const stats = await RNFS.stat(path);
      console.log(`File size: ${stats.size} bytes`);
      if (stats.size < 1000) {
        console.warn("File size is too small, possible corruption");
      }

      // Step 7: Update Media Store with retry
      if (Platform.OS === "android") {
        try {
          await RNFS.scanFile(path);
          console.log("Media Store updated for:", path);
        } catch (scanError) {
          console.error("Failed to update Media Store:", scanError);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          try {
            await RNFS.scanFile(path);
            console.log("Media Store retry successful for:", path);
          } catch (retryError) {
            console.error("Media Store retry failed:", retryError);
          }
        }
      }

      console.log(`✅ File saved to: ${path}`);
      return path;
    } catch (error) {
      console.error("Error creating Excel file:", error);
      return null;
    }
  };

  const shareExcelFile = async (filePath, title) => {
    try {
      if (!filePath) {
        console.warn("No file path provided for sharing");
        return;
      }
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        console.warn("File does not exist at:", filePath);
        return;
      }
      const sharePath = Platform.OS === "android" ? `file://${filePath}` : filePath;
      console.log("Sharing file from:", sharePath);
      await Share.open({
        title: title || "Exported File",
        url: sharePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      console.log("File shared successfully");
    } catch (error) {
      console.error("Error sharing file:", error.message);
    }
  };

  return { generateExcelFile, shareExcelFile };
};
