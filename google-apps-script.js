/**
 * =========================================================================
 * 🚀 AutoFlow - Google Apps Script CRM & Webhook
 * =========================================================================
 * 
 * קובץ סקריפט מוכן לחיבור טופס האתר ישירות ל-Google Sheets.
 * 
 * תכונות:
 * 1. @OnlyCurrentDoc - הרשאה אך ורק לקובץ הגיליון הזה (בלי גישה לדרייב או לקבצים אחרים!).
 * 2. יצירה ועיצוב אוטומטי של גיליון הלידים בשליחה הראשונה.
 * 3. פונקציית בדיקה (doGet) להצגת סטטוס פעיל בלחיצה בדפדפן.
 * 4. דשבורד סטטיסטיקות CRM מלא (setupCRM).
 * 5. סינון ספאם ובוטים מובנה (Honeypot).
 * 
 * הוראות פריסה מהירות (ב-30 שניות):
 * 1. פתח גיליון Google Sheets חדש.
 * 2. לחץ בתפריט: הרחבות (Extensions) > Apps Script.
 * 3. מחק את מה שכתוב שם, והדבק את כל תוכן הקובץ הזה.
 * 4. לחץ שמור (Ctrl + S).
 * 5. לחץ על הכפתור הכחול: פריסה (Deploy) > פריסה חדשה (New deployment).
 *    - סוג: יישום אינטרנט (Web app)
 *    - בצע כ (Execute as): אני (Me)
 *    - למי יש גישה (Who has access): כולם (Anyone)  <-- חובה!
 * 6. לחץ פריסה (Deploy), העתק את ה-URL ועדכן אותו באתר.
 * =========================================================================
 */

/**
 * @OnlyCurrentDoc
 */

const SHEET_LEADS = "לידים נכנסים";
const SHEET_DASHBOARD = "דשבורד CRM";

/**
 * בדיקת סטטוס פשוטה בלחיצה על הקישור בדפדפן (GET)
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html dir="rtl" style="font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
      <div style="background: #1e293b; padding: 40px; border-radius: 16px; text-align: center; max-width: 500px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155;">
        <div style="font-size: 52px; margin-bottom: 12px;">🚀</div>
        <h2 style="margin: 0 0 10px 0; color: #38bdf8;">ה-Webhook של AutoFlow פעיל!</h2>
        <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">הקישור מוגדר ותקין. ה-Google Sheet מוכן לקבל לידים ישירות מטופס האתר, עם הרשאה לקובץ זה בלבד.</p>
        <div style="background: #0f172a; padding: 12px; border-radius: 8px; font-size: 15px; color: #4ade80; margin-top: 20px; font-weight: bold; border: 1px solid #1e293b;">
          סטטוס: מחובר ומוכן לקבלת לידים ✅
        </div>
      </div>
    </html>
  `).setTitle("AutoFlow Webhook Status");
}

/**
 * קליטת ליד חדש מטופס האתר (POST)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lockErr) {
    Logger.log("Lock acquisition warning: " + lockErr);
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      throw new Error("לא נמצא גיליון אלקטרוני מקושר.");
    }

    // קריאת הנתונים מהבקשה
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // הגנה מבוטים (Honeypot) - אם השדה הסמוי מולא, מתעלמים
    if (data.bot_check && String(data.bot_check).trim() !== "") {
      return ContentService.createTextOutput(JSON.stringify({ result: "ignored" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // הבטחת קיום גיליון הלידים והכותרות
    const sheet = ensureLeadsSheet(ss);

    // חילוץ הנתונים
    const nowFormatted = Utilities.formatDate(new Date(), "Asia/Jerusalem", "dd/MM/yyyy HH:mm");
    const name = data.name ? String(data.name).trim() : "ללא שם";
    const phone = data.phone ? String(data.phone).trim() : "";
    const message = data.message ? String(data.message).trim() : "";

    // הוספת הליד לשורה הבאה
    const nextRow = sheet.getLastRow() + 1;
    sheet.getRange(nextRow, 1, 1, 5).setValues([[
      nowFormatted,
      name,
      phone,
      message,
      false // צ'קבוקס "טופל" - לא מסומן כברירת מחדל
    ]]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", row: nextRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("Error in doPost: " + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * פונקציית עזר: מבטיחה שגיליון הלידים קיים, מעוצב וכולל תיבות סימון
 */
function ensureLeadsSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_LEADS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_LEADS, 0);
    
    // יצירת שורת כותרות מעוצבת
    const headers = ["תאריך כניסה", "שם מלא", "טלפון", "הודעה / אתגר", "טופל? (V)"];
    sheet.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight("bold")
      .setFontSize(11)
      .setBackground("#0f172a")
      .setFontColor("#ffffff")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

    sheet.setRowHeight(1, 40);
    sheet.setFrozenRows(1);

    // הגדרת רוחב עמודות אידיאלי
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(2, 160);
    sheet.setColumnWidth(3, 140);
    sheet.setColumnWidth(4, 280);
    sheet.setColumnWidth(5, 110);

    // הגדרת צ'קבוקסים לעמודת הסטטוס
    const checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    sheet.getRange("E2:E1000").setDataValidation(checkboxRule).setHorizontalAlignment("center");
  }
  return sheet;
}

/**
 * פונקציה לבניית דשבורד CRM מעוצב עם נוסחאות וכרטיסיות KPI
 */
function setupCRM() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  // 1. הקמת גיליון הלידים
  ensureLeadsSheet(ss);

  // 2. הקמת גיליון הדשבורד
  let dashboard = ss.getSheetByName(SHEET_DASHBOARD);
  if (!dashboard) {
    dashboard = ss.insertSheet(SHEET_DASHBOARD, 0);
  }
  dashboard.clear();
  dashboard.clearFormats();

  // כותרת ראשית
  dashboard.getRange("B2:E2").merge()
    .setValue("📊 דשבורד לידים AutoFlow")
    .setFontSize(16)
    .setFontWeight("bold")
    .setFontColor("#0f172a")
    .setBackground("#f8fafc")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  dashboard.setRowHeight(2, 45);

  // כרטיסיות KPI
  createKpiCard(dashboard, "B4", "B5", "סה״כ לידים 👥", `=COUNTA('${SHEET_LEADS}'!A2:A)`, "#2563EB", "#EFF6FF", "0");
  createKpiCard(dashboard, "C4", "C5", "טופלו ✅", `=COUNTIF('${SHEET_LEADS}'!E2:E, TRUE)`, "#059669", "#ECFDF5", "0");
  createKpiCard(dashboard, "D4", "D5", "ממתינים ⏳", `=B5-C5`, "#D97706", "#FFFBEB", "0");
  createKpiCard(dashboard, "E4", "E5", "אחוז טיפול 📈", `=IF(B5>0, C5/B5, 0)`, "#7C3AED", "#F5F3FF", "0.0%");

  dashboard.setRowHeight(4, 28);
  dashboard.setRowHeight(5, 40);

  // מחיקת הגיליון הראשוני הישן אם נוצר
  const defaultSheet = ss.getSheetByName("Sheet1") || ss.getSheetByName("גיליון1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  Logger.log("התקנת ה-CRM הושלמה בהצלחה!");
}

function createKpiCard(sheet, titleCell, valCell, titleText, formula, mainColor, bgColor, formatPattern) {
  sheet.getRange(titleCell).setValue(titleText).setFontSize(10).setFontWeight("bold").setFontColor(mainColor).setBackground(bgColor).setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange(valCell).setFormula(formula).setFontSize(16).setFontWeight("bold").setFontColor("#0F172A").setBackground(bgColor).setHorizontalAlignment("center").setVerticalAlignment("middle").setNumberFormat(formatPattern);
  sheet.getRange(`${titleCell}:${valCell}`).setBorder(true, true, true, true, false, false, mainColor, SpreadsheetApp.BorderStyle.SOLID);
}
