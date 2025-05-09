"use strict";

(function ($) {
window.AssetSelection = function (debugMode) {
this.debugMode = debugMode || false;
var clientID = null;
var externalSystem = null;
var externalSystemConnectPort = null;
var externalSystemEndPoint = null;
var externalSystemUser = null;
var externalSystemClientSecret = null;
var finalAssetsList = [];
};

$.extend(window.AssetSelection.prototype,{

_getOrigin: function(url) {
if (url != '') {
if (url.indexOf("://") > -1) {
return 'https://' + url.split('/')[2];
} else {
return 'https://' + url.split('/')[0];
}
}
return '';
},_getDomain: function(url) {
if (url != '') {
if (url.indexOf("://") > -1) {
return url.split('/')[2];
} else {
return url.split('/')[0];
}
}
return '';
},_sendPostMessageData: function (data) {
var originUrl = document.referrer || (document.location.ancestorOrigins && document.location.ancestorOrigins[0]) || '';
var isString = 'string' === typeof data;
if (originUrl) {
parent.postMessage(data, this._getOrigin(originUrl));
} else {
console.log(data.method+' ERROR. UNABLE TO GET REFERRER');
}
},

_getPostMessageData: function (event) {
var getMessageDate = new Date();
if (typeof event.data === 'undefined') {
return false;
}
console.log ('DATA ' + JSON.stringify (event ) );
var data = JSON.parse(event.data); 
if (!data.method) {
return false;
}
switch (data.method) {
case 'init':
this.pluginInitEnd(data);
break;
case 'open':
this.pluginOpen(data);
break;
case 'updateResult':
this.updateResult(data);
break;
default:
if(data.method == 'error'){
alert('Error in performing the operation. Please contact your supervisor.');
}
break;
}
},

init: function () {
window.addEventListener("message", this._getPostMessageData.bind(this), false);
  // Escuchar mensaje de NFC externo (fuera de iframes)
  window.addEventListener('message', (event) => {
    if (event.data && event.data.method === "nfcScanned") {
      const scannedValue = event.data.value;
      document.getElementById('searchAsset').value = scannedValue;
      // Si usas jQuery y quieres disparar el evento keyup:
      // $('#searchAsset').val(scannedValue).keyup();
      console.log("📶 Valor recibido por NFC:", scannedValue);
    }
  }, false);
var jsonToSend = {apiVersion:1,method:'ready',showHeader:true,enableBackButton:true,sendInitData:true};
this._sendPostMessageData(jsonToSend);		
}, _getTodayDate: function() {
var date = null;
var newDate = new Date();
var month = newDate.getMonth()+1;
var day = newDate.getDate();
date =  newDate.getFullYear() + '-' +
(month<10 ? '0' : '') + month  + '-' +
(day<10 ? '0' : '') + day;
return date;
}, _getEarlierDate: function(daysDiff) {
var earlierDate = new Date();	
earlierDate.setDate(earlierDate.getDate() - daysDiff);
var month = earlierDate.getMonth()+1;
var day = earlierDate.getDate();
var returnDate = earlierDate.getFullYear() + '-' +
(month<10 ? '0' : '') + month  + '-' +
(day<10 ? '0' : '') + day;
return returnDate;
}, _getLaterDate: function(startDate,days) {
startDate = new Date(startDate);
var activityDate = startDate;
activityDate.setDate(startDate.getDate() + parseInt(days));
var month = activityDate.getMonth()+1;
var day = activityDate.getDate();
var returnDate = activityDate.getFullYear() + '-' +
(month<10 ? '0' : '') + month  + '-' +
(day<10 ? '0' : '') + day;
return returnDate;
},

_getDateDifferenceInDays:function(startDate,endDate) {
startDate = new Date(startDate);
endDate = new Date(endDate);
var diffTime = Math.abs(endDate - startDate);
var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
return diffDays;
},

_isDate1GreaterThanDate2:function(date1,date2) {
var dateOne = new Date(date1);
var dateTwo = new Date(date2);
if(dateOne>=dateTwo) {
console.log('True');
return true;
}else{
console.log('False');
return false;
}
},

pluginOpen: function (receivedData) {
var globalVars = this;
$('#assetsList').children().remove();

try {
var assetList = this._fetchPluginAssets(receivedData);
this.finalAssetsList = assetList;
}catch(error){
console.error('ERROR :: '+error);
var jsonToSend = {apiVersion:1,method:'close',entity:'activityList'};
this.exitPlugin(jsonToSend);
}

$('#cancelOperation').unbind().click(function() {
var jsonToSend = {apiVersion:1,method:'close',entity:'activityList'};
globalVars.exitPlugin(jsonToSend);
});

$('#saveAsset').unbind().click(function() {
globalVars._saveAsset(receivedData);
});

$('#closeAlert').unbind().click(function() {
globalVars._popupAert(0,'Processing completed',0);
});

if((receivedData.openParams.actionAt == 'inventory') && (receivedData.openParams.action == 'install')) {
$('#assetsListTag').html('Select Asset for Installation');
$("#searchAsset").on("keyup", function() {
var searchValue = $(this).val().toLowerCase();
$(this).val(searchValue);
$("#assetsList > div").children(".assetNo").filter(function() {
$(this).parent().toggle($(this).text().replaceAll('Asset Number: ','').toLowerCase().indexOf(searchValue) > -1)
});
});
} else if((receivedData.openParams.actionAt == 'inventory') && (receivedData.openParams.action == 'deinstall')) {
$('#searchAsset').attr('placeholder','Parent asset number');
$('#searchAssetLabel').html('Search Parent Asset');
$('#assetsListTag').html('Select Asset for Deinstall');
$("#searchAsset").on("keyup", function() {
var searchValue = $(this).val().toLowerCase();
$(this).val(searchValue);
$("#assetsList > div").children(".parentAssetNo").filter(function() {
$(this).parent().toggle($(this).text().replaceAll('Parent Asset: ','').toLowerCase().indexOf(searchValue) > -1)
});
});

$('.selectAsset').unbind().click(function(){
var selectedAssetIndex = this.id.replaceAll('asset_','');
if(globalVars.finalAssetsList.length>0) {
var selectedAsset = globalVars.finalAssetsList[selectedAssetIndex];
var quantity = 1;
var itemNumber = selectedAsset.iNo;
var serialNumber = selectedAsset.sNo;
var parentAssetNumber = selectedAsset.pNo;
$('#itemNumber').val(itemNumber);
$('#quantity').val(quantity);
$('#serialNumber').val(serialNumber);
} else {
//console.error('No Assets found');
}				
});

} else {
$("#searchAsset").on("keyup", function() {
var searchValue = $(this).val().toLowerCase();
$(this).val(searchValue);
$("#assetsList > div").children(".filter-titles").filter(function() {
$(this).parent().toggle($(this).text().toLowerCase().indexOf(searchValue) > -1)
});
});
}
  document.getElementById('launchNFCScan').addEventListener('click', () => {
    window.open('nfc-reader.html', '_blank');
  });
document.addEventListener('contextmenu', event => event.preventDefault());
console.info('['+new Date()+'] Asset selection '+'is ready');
}, _clearFewCacheItems: function(){
localStorage.remove('suman');
}, exitPlugin: function(jsonToSend) {
this._sendPostMessageData(jsonToSend);
}, _saveAsset:function(data) {
var radios = document.getElementsByName("assetSelection");
var actions = [];
var jsonRequest = null;
var selectedAssetIndex = -1;
var buttonIndex = 0;

for(var index=0;index<radios.length;index++ ) {
if(radios[index].checked) {
selectedAssetIndex = parseInt(radios[index].id.replace('asset_',''));
break;
}
}
if(selectedAssetIndex==-1) {
alert('Please select an asset');
return null;
}
var selectedAsset = this.finalAssetsList[selectedAssetIndex];
var assetNumber = selectedAsset.AssetNumber;
var defectDescription = selectedAsset.Description;
var parentAssetNumber = selectedAsset.pNo;
var serialNumber = selectedAsset.SerialNumber;
var inventoryType = $('#inventoryTypesList :selected').val();
var quantity = $('#quantity').val();
var itemNumber = $('#itemNumber').val();

var activity = {"aid": data.activity.aid};
var actionAt = '';
var action = '';
console.log ("DANIEL " + JSON.stringify(data));
if(data.openParams) {
if(data.openParams.actionAt) {
actionAt = data.openParams.actionAt;
}
if(data.openParams.action) {
action = data.openParams.action;
}
}
if(actionAt == 'activity') {
if(data.openParams && data.openParams.buttonIndex) {
buttonIndex = data.openParams.buttonIndex;
}
} else if((actionAt == 'inventory') && (action == 'install')) {
actions[0] = {'entity':'inventory','action': 'install','inv_pid': data.resource.pid,'inv_aid': data.activity.aid,'invid':data.inventory.invid,'invtype': inventoryType,'properties':{
'XI_PARENT_ASSET':assetNumber
} } } else if((actionAt=='inventory') && (action=='deinstall')) {
actions[0] = {'entity':'inventory','action': 'create','invpool': 'customer', 'inv_aid': data.activity.aid,'invtype': inventoryType,'properties':{
'XI_PARENT_ASSET':parentAssetNumber,'mwo_subinventory':'RETURNED','invsn':serialNumber,'part_item_number': itemNumber,'part_item_desc': defectDescription
} } }

if(action=='deinstall') {
jsonRequest = {'apiVersion': 1,'method':'update','entity':'activityList',activity};
} else {
jsonRequest = {'apiVersion': 1,'method':'close','entity':'activityList','backScreen':'inventory_list','backActivityId':data.activity.aid,activity};
}			

if(actions.length>0) {
jsonRequest['actions'] = actions;
}
this.exitPlugin(jsonRequest);
},

pluginInitEnd: function (data) {
// Constante con tipos de inventario de ejemplo
const constinventoryTypesMock = {
type: "enum",
"enum": {
"EXAMPLE_TYPE_1": {
  label: "EXAMPLE_TYPE_1",
  text: "Example Type 1",
  inactive: false,
  nonSerialized: false
},
"EXAMPLE_TYPE_2": {
  label: "EXAMPLE_TYPE_2",
  text: "Example Type 2",
  inactive: false,
  nonSerialized: false
}
}
};	
//localStorage.setItem('inventoryTypes',JSON.stringify(data.attributeDescription.invtype));
localStorage.setItem('inventoryTypes', JSON.stringify(constinventoryTypesMock));
const retrievedItem = localStorage.getItem('inventoryTypes');
console.log('Valor recuperado:', JSON.parse(retrievedItem));
var messageData = {apiVersion:1,method:'initEnd',wakeupNeeded:true};
this._sendPostMessageData(messageData);
},	

_fetchPluginAssets: function(assetsData) {

var assetList = [];
if(assetsData.activity.XA_ASSET_HIERARCHY_COUNT!=null && assetsData.activity.XA_ASSET_HIERARCHY_COUNT>0) {
var assetPropertyCount = assetsData.activity.XA_ASSET_HIERARCHY_COUNT
for(var assetsPropertyIndex=1;assetsPropertyIndex<=assetPropertyCount;assetsPropertyIndex++) {
var assetDetails = JSON.parse(assetsData.activity['XA_ASSET_HIERARCHY_'+assetsPropertyIndex]);
var propertyAssets = assetDetails["assets"];
for(var assetIndex=0;assetIndex<propertyAssets.length;assetIndex++) {
assetList.push(propertyAssets[assetIndex]);

}
}		
} else {
console.log('1 No assets found. Please contact administrator');	
alert (	'1 No assets found. Please contact administrator');		
}
this._renderAssetsList(assetsData,assetList);
console.log('render..' + JSON.stringify ( assetsData ) +  + JSON.stringify ( assetList ) )
if(assetsData.openParams.actionAt == 'inventory') {
//$('#searchContainer').hide();	
$('#inventoryContainer').show();
} else {
$('#searchContainer').show();
$('#inventoryContainer').hide();
}
return assetList;
},

_renderAssetsList: function(assetsData,assetsList) {

var isRenderCompleted = true;
var actionAt = assetsData.openParams.actionAt;
	console.log('RENDER_RENDER1');
var inventoryTypes = JSON.parse(localStorage.getItem('inventoryTypes'));
	console.log('RENDER_RENDER2');

try{
if(assetsData.openParams) {

var inventoryTypesList = '';
$('#inventoryTypesList').children().remove();
//$('#inventoryTypesList').append('<option value="-1">Inventory Type</option>');
var inventoryTypeKeys = Object.keys(inventoryTypes['enum']);

for(var inventoryIndex=0;inventoryIndex<inventoryTypeKeys.length;inventoryIndex++){
var isSelected = false;
if(!inventoryTypes['enum'][inventoryTypeKeys[inventoryIndex]].inactive && inventoryTypes['enum'][inventoryTypeKeys[inventoryIndex]].nonSerialized==false) {
isSelected = true;

if(!isSelected){
inventoryTypesList =  '<option value='+inventoryTypes['enum'][inventoryTypeKeys[inventoryIndex]].label+' selected>'+inventoryTypes['enum'][inventoryTypeKeys[inventoryIndex]].text+'</option>';
} else {
inventoryTypesList =  '<option value='+inventoryTypes['enum'][inventoryTypeKeys[inventoryIndex]].label+'>'+inventoryTypes['enum'][inventoryTypeKeys[inventoryIndex]].text+'</option>';
}
$('#inventoryTypesList').append(inventoryTypesList);
}
}					

if(assetsData.openParams.actionAt == 'inventory' && assetsData.openParams.action == 'install') {
var inventory = assetsData.inventory;
var inventoryType = assetsData.inventory.invtype;					
$('#inventoryType').val(inventoryTypes['enum'][inventoryType]['text']);
$('#inventoryType').attr('name',inventoryType);
$('#quantity').val(inventory.quantity);
$('#itemNumber').val(inventory.part_item_number);
$('#serialNumber').val(inventory.invsn);

} else if(assetsData.openParams.actionAt == 'inventory' && assetsData.openParams.action == 'deinstall'){

$('#inventoryType').val('');
$('#inventoryType').attr('name','');
$('#quantity').val('');
$('#itemNumber').val('');
$('#serialNumber').val('');
}
}

if(assetsList.length>0) {
$('#assetsList').children().remove();
for(var indexOfAsset=0; indexOfAsset<assetsList.length; indexOfAsset++) {

var assetNumber = assetsList[indexOfAsset].AssetNumber ? assetsList[indexOfAsset].AssetNumber : '&nbsp;';
var assetDescription = assetsList[indexOfAsset].Description ? assetsList[indexOfAsset].Description : '&nbsp;';
var itemNumber = assetsList[indexOfAsset].ItemNumber ? assetsList[indexOfAsset].ItemNumber : '&nbsp;';
var itemDescription = assetsList[indexOfAsset].ItemDescription ? assetsList[indexOfAsset].ItemDescription : '&nbsp;';
var assetSerialNumber = assetsList[indexOfAsset].SerialNumber ? assetsList[indexOfAsset].SerialNumber : '&nbsp;';
var parentAssetNumber = assetsList[indexOfAsset].pNo ? assetsList[indexOfAsset].pNo : '&nbsp;';
var parentAssetDescription = assetsList[indexOfAsset].pDes ? assetsList[indexOfAsset].pDes : '&nbsp;';

var assetRow = '<div class="assetRow" id="'+indexOfAsset+'">';
assetRow = assetRow + '<div class="filter-titles selectSlNo"><h2 class="page-header-title" style="padding-left: 9px;font-size: 14px;font-family: \'Oracle Sans Semi\'!important; color: #70706e;" title="asset"><input type="checkbox" class="selectAsset" name="assetSelection" id="asset_'+indexOfAsset+'"></h2></div>';
assetRow = assetRow + '<div class="filter-titles assetNo"><h2 class="rowTitle">Numero Activo: </h2><h2 class="page-header-title" style="padding-left: 9px;font-size: 14px;font-family: \'Oracle Sans Semi\'!important; color: #70706e;" title="Numero Activo">'+assetNumber+'</h2></div>';
//assetRow = assetRow + '<div class="filter-titles des"><h2 class="rowTitle">Asset Description: </h2><h2 class="page-header-title" style="padding-left: 9px;font-size: 14px;font-family: \'Oracle Sans Semi\'!important; color: #70706e;" title="des">'+assetDescription+'</h2></div>';
//if(assetsData.openParams.actionAt == 'inventory' && assetsData.openParams.action == 'deinstall') { 
assetRow = assetRow + '<div class="filter-titles itemNo"><h2 class="rowTitle">Item Number: </h2><h2 class="page-header-title" style="padding-left: 9px;font-size: 14px;font-family: \'Oracle Sans Semi\'!important; color: #70706e;" title="Item">'+itemNumber+'</h2></div>';
assetRow = assetRow + '<div class="filter-titles serialNo"><h2 class="rowTitle">Serial Number: </h2><h2 class="page-header-title" style="padding-left: 9px;font-size: 14px;font-family: \'Oracle Sans Semi\'!important; color: #70706e;" title="Numero Serie">'+assetSerialNumber+'</h2></div>';
//assetRow = assetRow + '<div class="filter-titles parentAssetNo"><h2 class="rowTitle">Parent Asset: </h2><h2 class="page-header-title" style="padding-left: 9px;font-size: 14px;font-family: \'Oracle Sans Semi\'!important; color: #70706e;" title="parentAssetNo">'+parentAssetNumber+'</h2></div>';
//}
assetRow = assetRow + '<div class="filter-titles des"><h2 class="rowTitle">Asset Description: </h2><h2 class="page-header-title" style="padding-left: 9px;font-size: 14px;font-family: \'Oracle Sans Semi\'!important; color: #70706e;" title="Descripcion">'+assetDescription+'</h2></div>';
assetRow = assetRow + '</div>';
$('#assetsList').append(assetRow);
}
}else{
console.log('No assets to render.');
}
this.assetsList = assetsList;
var woAssetName = assetsData.activity.wo_asset_name || 'ERROR';
var customerAddress = assetsData.activity.caddress || 'NOT FOUND';
$('#assetsListTag').text(woAssetName + (customerAddress ? ' - ' + customerAddress : ''));
return isRenderCompleted;				
} catch(err) {
console.error('Unable to render assets :: '+err);
$('#assetsList').children().remove();
isRenderCompleted = false;
return isRenderCompleted;				
}
}, updateResult: function(data) {
var actions = [];
var inventoryIDs = Object.keys(data.inventoryList);
var actionIndex = 0;
for(var inventoryIndex=0;inventoryIndex<inventoryIDs.length;inventoryIndex++) {
var inventory = data.inventoryList[inventoryIDs[inventoryIndex]];
if(inventory.invpool == 'customer' && inventory.invid.indexOf('-')>0) {
actions[actionIndex] = { 'entity':'inventory','action': 'deinstall','invid':inventory.invid,'inv_pid': data.resource.pid,'inv_aid': data.activity.aid,}
actionIndex++;
}
}
var jsonRequest = {apiVersion:1,method:'close',entity:'activityList',actions};
this.exitPlugin(jsonRequest);
}, _popupAert: function(showPopupAlert,alertMessage,dismissButtonRequired) {
$('#alertContent').html(alertMessage);
if(showPopupAlert==1) 
{
$('#popupAlert_Page').show();
$('#alertLight').css("display",'block');
$('#alertFade').css("display",'block');
}
else if(showPopupAlert==0)
{
document.body.style.overflow = 'visible';
$('#popupAlert_Page').hide();
$('#alertLight').css("display",'none');
$('#alertFade').css("display",'none');
}
else
{
document.body.style.overflow = 'visible';
$('#popupAlert_Page').hide();
$('#alertLight').css("display",'none');
$('#alertFade').css("display",'none');
}
if(dismissButtonRequired==1) {
$('#alertDismissDiv').css('display','block');
} 
else
{
$('#alertDismissDiv').css('display','none');
}
},	_sendPostMessageDat: function(data) {
var authenticate = "authenticator";
var system = 'ofscPlugin';
$.ajax({headers:{'Authorization' : authenticate,"Access-Control-Allow-Methods": "*","Access-Control-Allow-Headers": "'Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token'"},url: system,type: 'POST',data: data,dataType: 'json',});
}		
});
})(jQuery);
