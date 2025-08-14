import ExcelJS from "exceljs";
import RNFS from "react-native-fs";
import Share from "react-native-share";
import { Platform } from "react-native";

export const useExcelExporter = () => {
  const generateExcelFile = async ({ data, headers, fileName, sheetName }) => {
    console.log(data)
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName || "Sheet1");

      // --- 1. Header Row with Style ---
      const headerRow = headers.map((h) => h.label);
      const headerRowObj = worksheet.addRow(headerRow);

      // Set header row height (customizable)
      worksheet.getRow(1).height = 40;

      headerRowObj.eachCell((cell) => {
        cell.fill = {
          type: "pattern", pattern: "solid", fgColor: { argb: "FF0000" }, // red background
        };
        cell.font = { bold: true, color: { argb: "000000" } }; // black text
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      });

      // --- 2. Shared Fields (to merge vertically) ---
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
      
      // --- 3. Add Data Rows ---
 // --- 3. Add Data Rows ---
data.forEach((item, index) => {
  const row = headers.map(({ key }) => {
    if (key === "part_no" || key === "description" || key === "hsn_no") {
      return item[key] != null ? item[key].toString() : "";
    } else {
      return item[key] != null ?item[key]!=""? parseFloat(item[key]):"" : 0;
    }
  });

  const rowObj = worksheet.addRow(row);
  const isLastRow = index === data.length - 1;

  // Center alignment and borders
  rowObj.eachCell((cell) => {
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    if (!isLastRow) {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  });

  rowObj.height = 15; // fixed data row height
});

      // --- 4. Column Widths (set for every column) ---
      const customWidths = {
        1: 5, 2: 15, 3: 40, 4: 15, 5: 10, 6: 8, 7: 10,
        8: 10, 9: 20, 10: 8, 11: 8, 12: 6, 13: 6, 14: 6, 15: 6, 16: 8, 17: 20,
        18: 8, 19: 20, 20: 7, 21: 7, 22: 7, 23: 8, 24: 15
      };
      headers.forEach((h, i) => {
        const colIndex = i + 1;
        if (customWidths[colIndex]) {
          worksheet.getColumn(colIndex).width = customWidths[colIndex];
        } else if (h.width) {
          worksheet.getColumn(colIndex).width = Math.round(h.width / 7);
        } else {
          worksheet.getColumn(colIndex).width = 20; // default fallback
        }
      });


      // --- 5. Merge Shared Fields vertically by `case_no_start` ---
      let groupStartRow = 2; // first data row (row 2)
      for (let i = 1; i < data.length; i++) {
        const prevStart = data[i - 1].case_no_start;
        const currentStart = data[i].case_no_start;

        if (prevStart !== currentStart) {
          mergeSharedFields(groupStartRow, i + 1, sharedFields, headers, worksheet);
          groupStartRow = i + 2; // new group start
        }
      }
      // Merge last group
      mergeSharedFields(groupStartRow, data.length + 1, sharedFields, headers, worksheet);

      // --- 6. Freeze Header Row ---
      worksheet.views = [{ state: "frozen", ySplit: 1 }];

      // --- 7. Save File ---
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = arrayBufferToBase64(buffer);

      const path = `${RNFS.DownloadDirectoryPath}/${fileName}.xlsx`;
      await RNFS.writeFile(path, base64, "base64");

      if (Platform.OS === "android") {
        try {
          await RNFS.scanFile(path);
        } catch (scanError) {
          console.warn("Media Store update failed:", scanError);
        }
      }

      return path;
    } catch (error) {
      console.error("Error creating Excel file:", error);
      return null;
    }
  };

  // --- Helper: Merge columns in sharedFields between startRow and endRow ---
  function mergeSharedFields(startRow, endRow, sharedFields, headers, worksheet) {
    if (endRow - 1 <= startRow) return; // only merge if block > 1 row
    sharedFields.forEach((field) => {
      const colIndex = headers.findIndex((h) => h.key === field) + 1;
      if (colIndex > 0) {
        worksheet.mergeCells(startRow, colIndex, endRow - 1, colIndex);
        const mergedCell = worksheet.getCell(startRow, colIndex);
        mergedCell.alignment = { vertical: "middle", horizontal: "center" };
      }
    });
  }

  // --- Helper: Convert ArrayBuffer → Base64 ---
  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return global.btoa(binary);
  }

  // --- Share File ---
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
