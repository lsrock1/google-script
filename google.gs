var SCRIPT_PROP = PropertiesService.getScriptProperties();

function doGet(e){
  return handleResponse(e);
}

function doPost(e){
  return handleResponse(e);
}

function plus(type, original, data){
  var value;

  if (type == "web"){
    if (original == 1 && data == -1){
      value = 0;
    }
    else if (original == 0 && data == 1){
      value = 1;
    }
    else{
      value = original;
    }
    return value;
  }
  else if(type == "android" || type == "ios"){
    if (original == 3 && data < 0){
      value = original + data;
    }
    else if (original == 2 && (data == -2 || data == 1)){
      value = original + data;
    }
    else if (original == 1 && (data == -1 || data == 2)){
      value = original + data;
    }
    else if (original == 0 && data > 0){
      value = original + data;
    }
    else{
      value = original;
    }
    return value;
  }
  return original;
}

function handleResponse(e) {
  
  var lock = LockService.getUserLock();
  lock.waitLock(3000);

  try {
    var id = e.parameter["id"],
      language = e.parameter["language"],
      type = e.parameter["type"],
      value = 0,
      name,
      sheetName = "info",
      rowNum = -1,
      check=0,
      info;

    if (e.parameter["like"]){
      value=1;
      name=e.parameter["like"];
    }
    else if(e.parameter["unlike"]){
      value=-1;
      name=e.parameter["unlike"];
    }
    else if(e.parameter["alarmOn"]){
      value=2;
      name = e.parameter["alarmOn"];
    }
    else if(e.parameter["alarmOff"]){
      value=-2;
      name = e.parameter["alarmOff"];
    }
    else if(e.parameter["favorite"]){
      value=1;
      name = e.parameter["favorite"];
      sheetName="rest";
    }
    else if(e.parameter["unfavorite"]){
      value=-1;
      name = e.parameter["unfavorite"];
      sheetName="rest";
    }
    
    Logger.log(name, sheetName);
    // next set where we write the data - you could write to multiple/alternate destinations
    var doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    var sheet = doc.getSheetByName(sheetName);

    var idColumn = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = [];
    
    for (var i in idColumn){
      if(idColumn[i][0] == id){
        rowNum=Number(i)+1;
        break;
      }
    }
    
    if(rowNum == -1){
      Logger.log("cannot find by your id");
      info="new";
      
      rowNum=sheet.getLastRow()+1;
      
      for (i in headers){
        if (headers[i] == "id"){
          row.push(id);
        }
        else if(headers[i] == "language"){
          row.push(language);
        }
        else if(headers[i] == "type"){
          row.push(type);
        }
        else if(headers[i] == name){
          row.push(plus(type, 0, value));
          check = 1;
        }
        else{
          row.push(0);
        }
      }
      if(check==0) {
        row.push(plus(type, 0, value));
      }
      sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
    }
    else{
      info="update";
      tempRow=sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
      for (var i in headers){
        if (headers[i] == "id"){
          row.push(id);
        }
        else if (headers[i] == "language"){
          row.push(language);
        }
        else if (headers[i] == "type"){
          row.push(type);
        }
        else if(headers[i] == name){
          var rowValue = Number(tempRow[i]);
          row.push(plus(type, rowValue, value));
          check=1;
        }
        else{
          row.push(tempRow[i]);
        }
      }
      if(check==0){
        row.push(plus(type, 0, value));
      }
      sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
    }
    
    if (check==0){
      sheet.getRange(1, sheet.getLastColumn()).setValues([[name]]);
    }
    
    return ContentService
    .createTextOutput(JSON.stringify({"result":"success", "row":row, "rowNumber": rowNum, "info": info}))
	  .setMimeType(ContentService.MimeType.JSON);
  }
  catch(e){
    
    return ContentService
	  .createTextOutput(JSON.stringify({"result":"error", "error": e}))
	  .setMimeType(ContentService.MimeType.JSON);
    
  }
  finally {
    lock.releaseLock();
  }
}
 
function setup() {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  SCRIPT_PROP.setProperty("key", doc.getId());
}