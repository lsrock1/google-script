var SCRIPT_PROP = PropertiesService.getScriptProperties();

function doGet(e){
  return handleResponse(e);
}

function doPost(e){
  return handleResponse(e);
}

function handleResponse(e) {
  
  var lock = LockService.getUserLock();
  lock.waitLock(3000);

  try {
    var id = e.parameter["id"];
    var value=0;
    var name;
    var sheetName="info";
    var rowNum=-1;
    var check=0;
    var info;
    var infoRow;
    if (e.parameter["like"]){
      value=1;
      name=e.parameter["like"];
    }
    else if(e.parameter["alarm"]){
      value=2;
      name = e.parameter["alarm"];
    }
    else if(e.parameter["favorite"]){
      value=1;
      name = e.parameter["favorite"];
      sheetName="rest";
    }
    
    Logger.log(name, sheetName);
    // next set where we write the data - you could write to multiple/alternate destinations
    var doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    var sheet = doc.getSheetByName(sheetName);

    // we'll assume header is in row 1 but you can override with header_row in GET/POST data
    var idColumn = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = [];
    
    for (var i in idColumn){
      if(idColumn[i][0] == id){
        rowNum=Number(i)+1;
        break;
      }
    }
    
    //해당 id 없으면
    if(rowNum==-1){
      Logger.log("cannot find by your id");
      info="new";
      
      rowNum=sheet.getLastRow()+1;
      
      for (i in headers){
        if (headers[i] == "id"){
          row.push(id);
        }
        else if(headers[i] == name){
          row.push(value);
          check=1;
        }
        else{
          row.push(0);
        }
      }
      if(check==0) {
        row.push(value);      
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
        else if(headers[i] == name){
          var tempValue=Number(tempRow[i]);
          if(tempValue==0){
            row.push(tempValue+value);
          }
          else if(tempValue==1){
            if(value==1){
              row.push(tempValue-value);
            }
            else{
              row.push(tempValue+value);
            }
          }
          else if(tempValue==2){
            if(value==1){
              row.push(tempValue+value);
            }
            else{
              row.push(tempValue-value);
            }
          }
          else{
            row.push(tempValue-value);
          }
          
          check=1;
        }
        else{
          row.push(tempValue||0);
        }
      }
      if(check==0){
        row.push(value);
      }
      Logger.log("push data :" + [row]);
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