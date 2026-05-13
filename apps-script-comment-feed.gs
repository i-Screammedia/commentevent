const SPREADSHEET_ID = "1-GPI1-NScaR-kV0CZ0OqRO4gYHNHvDE5SmgeBgOJCwg";
const SHEET_GID = 726680767;

function doGet(e) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getSheetByGid_(spreadsheet, SHEET_GID);

  if (!sheet) {
    return json_({
      error: "Sheet not found",
      sheetGid: SHEET_GID
    });
  }

  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1);

  const data = rows
    .map(function (row, index) {
      return {
        id: index + 1,
        createdAt: formatDate_(row[0]),
        nickname: maskName_(row[3]), // 이름
        message: String(row[7] || "").trim() // 댓글
      };
    })
    .filter(function (row) {
      return row.nickname && row.message;
    })
    .sort(function (a, b) {
      return b.id - a.id;
    });

  return json_(data);
}

function getSheetByGid_(spreadsheet, gid) {
  const sheets = spreadsheet.getSheets();

  for (let i = 0; i < sheets.length; i += 1) {
    if (sheets[i].getSheetId() === Number(gid)) {
      return sheets[i];
    }
  }

  return null;
}

function maskName_(name) {
  const value = String(name || "").trim();

  if (!value) return "";
  if (value.length === 1) return value;

  return value[0] + "*".repeat(value.length - 1);
}

function formatDate_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, "Asia/Seoul", "yyyy-MM-dd");
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, "Asia/Seoul", "yyyy-MM-dd");
  }

  return String(value || "").trim();
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
