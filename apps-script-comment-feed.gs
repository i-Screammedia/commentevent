/**
 * 구글폼 응답 스프레드시트 → 댓글 목록 JSON (GitHub Pages index.html COMMENTS_JSON_URL 에 연결)
 *
 * 문제가 나면 웹앱 URL 뒤에 ?debug=1 을 붙여 열어보세요. (예: .../exec?debug=1)
 * → 시트 1행 제목, 찾은 열 번호 등이 JSON으로 나와 원인 파악에 쓸 수 있습니다.
 *
 * 1) 구글폼 → 응답 → 스프레드시트로 연 응답 시트 주소에서
 *    https://docs.google.com/spreadsheets/d/이부분이_SHEET_ID/edit
 * 2) script.google.com 새 프로젝트에 이 코드 붙여넣기 → SPREADSHEET_ID 수정 → 저장
 * 3) 배포 → 웹 앱 (실행: 나, 액세스: 모든 사용자)
 * 4) 웹앱 URL을 index.html 의 COMMENTS_JSON_URL 에 넣기
 */
var SPREADSHEET_ID = "1-GPI1-NScaR-kV0CZ0OqRO4gYHNHvDE5SmgeBgOJCwg";

function maskName_(name) {
  name = String(name || "").trim();
  if (!name) return "";
  if (name.length <= 1) return name;
  var stars = "";
  for (var i = 1; i < name.length; i++) stars += "*";
  return name.charAt(0) + stars;
}

function findHeaderIndex_(headers, patterns) {
  for (var p = 0; p < patterns.length; p++) {
    for (var c = 0; c < headers.length; c++) {
      var h = String(headers[c] || "");
      if (patterns[p].test(h)) return c;
    }
  }
  return -1;
}

/** 질문 제목이 길고 '댓글'이 없을 때: 설문형 긴 문장 열을 추정 */
function guessLongAnswerColumn_(headers) {
  var skip = [/타임스탬프|Timestamp|응답\s*시간|교육청|학교|연락|전화|이메일|동의|체크|제출|미리보기|pageHistory/i];
  var best = -1;
  var bestLen = 0;
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || "").trim();
    if (h.length < 8) continue;
    var sk = false;
    for (var s = 0; s < skip.length; s++) {
      if (skip[s].test(h)) {
        sk = true;
        break;
      }
    }
    if (sk) continue;
    if (h.length >= bestLen) {
      bestLen = h.length;
      best = c;
    }
  }
  return best;
}

function pickResponseSheet_(ss) {
  var tryNames = ["Form Responses 1", "양식 응답 시트 1", "Form_Responses_1", "응답 시트 1"];
  for (var i = 0; i < tryNames.length; i++) {
    var sh = ss.getSheetByName(tryNames[i]);
    if (sh) return sh;
  }
  var sheets = ss.getSheets();
  for (var j = 0; j < sheets.length; j++) {
    var cand = sheets[j];
    var lastCol = Math.min(cand.getLastColumn(), 40);
    if (lastCol < 1) continue;
    var row1 = cand.getRange(1, 1, 1, lastCol).getValues()[0];
    var joined = row1.join(" ");
    if (/타임스탬프|Timestamp|응답\s*시간/i.test(joined) && (/이름|실명|성명|댓글|활용|소감|후기/i.test(joined))) {
      return cand;
    }
  }
  return sheets.length ? sheets[0] : null;
}

function formatTime_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  }
  return String(v || "").trim();
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var debug = e && e.parameter && String(e.parameter.debug) === "1";

  try {
    if (!SPREADSHEET_ID || SPREADSHEET_ID.indexOf("여기에") !== -1) {
      if (debug) {
        return jsonOut_({
          error: "SPREADSHEET_ID 를 스크립트 상단에 실제 시트 ID로 바꿨는지 확인하세요."
        });
      }
      return jsonOut_([]);
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sh = pickResponseSheet_(ss);
    if (!sh) {
      if (debug) return jsonOut_({ error: "시트를 찾을 수 없습니다." });
      return jsonOut_([]);
    }

    var values = sh.getDataRange().getValues();
    var headers = values.length ? values[0] : [];
    var headerStrings = [];
    for (var hi = 0; hi < headers.length; hi++) {
      headerStrings.push(String(headers[hi] || ""));
    }

    if (values.length < 2) {
      if (debug) {
        return jsonOut_({
          error: "응답 행이 없습니다(헤더만 있거나 비어 있음).",
          sheetName: sh.getName(),
          headers: headerStrings
        });
      }
      return jsonOut_([]);
    }

    var iTime = findHeaderIndex_(headers, [/타임스탬프/i, /Timestamp/i, /응답\s*시간/i]);
    var iName = findHeaderIndex_(headers, [/이름/i, /실명/i, /성명/i, /닉네임/i]);
    var iMsg = findHeaderIndex_(headers, [
      /댓글.*내용/i,
      /댓글\s*내용/i,
      /댓글/i,
      /활용법/i,
      /수업에서의\s*활용/i,
      /자유롭게\s*작성/i,
      /작성해\s*주세요/i,
      /활용\s*소감/i,
      /후기/i,
      /소감/i
    ]);
    if (iMsg === -1) {
      iMsg = guessLongAnswerColumn_(headers);
    }

    if (iName === -1 || iMsg === -1) {
      if (debug) {
        return jsonOut_({
          error: "이름 또는 댓글(긴답) 열을 자동으로 찾지 못했습니다. 시트 1행 제목을 확인하세요.",
          sheetName: sh.getName(),
          headers: headerStrings,
          iTime: iTime,
          iName: iName,
          iMsg: iMsg
        });
      }
      return jsonOut_([]);
    }
    if (iTime === -1) iTime = 0;

    var out = [];
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var rawName = row[iName];
      var msg = row[iMsg];
      if (!String(msg || "").trim()) continue;
      out.push({
        id: r,
        nickname: maskName_(rawName),
        message: String(msg || "").trim(),
        createdAt: formatTime_(row[iTime])
      });
    }
    out.sort(function (a, b) {
      return b.id - a.id;
    });

    if (debug) {
      return jsonOut_({
        ok: true,
        count: out.length,
        sheetName: sh.getName(),
        headers: headerStrings,
        usedColumns: { iTime: iTime, iName: iName, iMsg: iMsg },
        sample: out.slice(0, 3)
      });
    }

    return jsonOut_(out);
  } catch (err) {
    if (debug) {
      return jsonOut_({ error: String(err && err.message ? err.message : err) });
    }
    return jsonOut_([]);
  }
}
