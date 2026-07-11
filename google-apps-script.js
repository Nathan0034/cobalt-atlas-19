// 這個檔案不是專案程式的一部分，是要貼到 Google Apps Script 裡的內容。
// 設定步驟請看 README.md。

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '時間', '姓名', '性別', '國碼', '手機號碼',
      '出生年', '出生月', '出生日', 'Email',
      '地址類型', '縣市', '鄉鎮市區', '詳細地址',
      '行銷同意', '填寫語言',
    ]);
  }

  sheet.appendRow([
    new Date(),
    data.name || '',
    data.gender || '',
    data.phone_country_code || '',
    data.phone_number || '',
    data.birth_year || '',
    data.birth_month || '',
    data.birth_day || '',
    data.email || '',
    data.address_type || '',
    data.county || '',
    data.district || '',
    data.address_detail || '',
    data.marketing_consent ? '是' : '否',
    data.language || '',
  ]);

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
