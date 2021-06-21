import specialTable from '../def/special_tablekey_def.js'
import {edit_def} from '../def/dialog_edit_def.js'
// const PAGE_SIZE = window

// 处理特殊字段函数
function dealSpecialId (name, keyName) {
  return specialTable[name] ? specialTable[name] : keyName
}

// 转json函数
function toJson (data) {
  if (typeof data === 'object') {
    return data
  }

  let ret = null
  if (data && (typeof data === 'string')) {
    try {
      ret = JSON.parse(data)
    } catch (error) {
      console.warn('Can NOT parse the input data to be JSON : ', data)
    }
  } else {
    console.warn('The input data\'s type is NOT string : ', data)
  }

  return ret
}

// 对象连接函数
function concatObject (obj1, obj2) {
  for (var key in obj2) {
    if (obj1.hasOwnProperty(key)) continue// 有相同的属性则略过
    obj1[key] = obj2[key]
  }
  return obj1
}

Date.prototype.format = function (format) { // eslint-disable-line
  let o = {
    'M+': this.getMonth() + 1, // month
    'd+': this.getDate(), // day
    'h+': this.getHours(), // hour
    'm+': this.getMinutes(), // minute
    's+': this.getSeconds(), // second
    'q+': Math.floor((this.getMonth() + 3) / 3), // quarter
    'S': this.getMilliseconds() // millisecond
  }
  if (/(y+)/.test(format)) {
    format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
    }
  }
  return format
}

function paddingLeft (i) {
  let ret = '' + i
  if (i < 10) {
    ret = '0' + i
  }

  return ret
}

// 将毫秒数格式化为 hh:mm:ss 格式
function formatElapsedTime (ms) {
  if (ms <= 0) {
    return '00:00:00'
  }

  const h = 60 * 60 * 1000
  const m = 60 * 1000
  const s = 1000

  let hh = Math.floor(ms / h)
  let mm = Math.floor(ms % h / m)
  let ss = Math.floor(ms % h % m / s)

  let shh = paddingLeft(hh)
  let smm = paddingLeft(mm)
  let sss = paddingLeft(ss)

  return shh + ':' + smm + ':' + sss
}

// 判断各种浏览器，找到正确的进入全屏的方法
// element : 需要全屏的 node
function requestFullScreen (element) {
  let requestMethod = element.requestFullScreen || // W3C
        element.webkitRequestFullScreen || // Chrome等
        element.mozRequestFullScreen || // FireFox
        element.msRequestFullScreen // IE11
  if (requestMethod) {
    requestMethod.call(element)
  }
}

// 判断各种浏览器，找到正确的退出全屏的方法
function exitFullScreen () {
  let exitMethod = document.cancelFullScreen || // W3C
        document.webkitCancelFullScreen || // Chrome等
        document.mozCancelFullScreen || // FireFox
        document.msExitFullscreen // IE11
  if (exitMethod) {
    exitMethod.call(document)
  }
}

// 取消呼叫
function cancelCallCard (readers, cards, userName) {
  let message = {
    cmd: 'call_card_cancel_req',
    data: {
      call_type_id: 0,
      user_name: userName,
      call_time: new Date().getTime(),
      stations: readers,
      cards: cards
    }
  }
  return message
}

// 呼叫
function callCards (type, time, userName) {
  let message = null
  if (type === 1) {

  } else {
    message = { // 一键撤离(全员呼叫)，紧急呼叫2
      cmd: 'call_card_req',
      data: {
        call_type_id: 0,
        call_time_out: 5,
        call_level_id: 2,
        user_name: userName,
        call_time: new Date().getTime(),
        stations: [{
          stationid: 0
        }],
        cards: [{
          cardid: '0',
          cardtype: 1
        }]
      }
    }
  }
  return message
}

// 格式化数据函数
function getRows (values, def, maxid) {
  values = values ? values : null
  let rows = []
  let length = def.fields.names.length

  for (let i = 0; i < length; i++) {
    let v = values ? values[def.fields.names[i]] : ''

    if (!values && i == def.keyIndex) { // 新增记录，id 为 最大id+1
      v = maxid ? maxid + 1 : 0
    } else if (def.fields.types[i] === 'DATE') {
      v = v ? new Date(v).format('yyyy-MM-dd') : ''
    } else if (def.fields.names[i] === 'user_id' && def.name != 'user'){
      v = xdata && xdata.username
    }
    let enableNull = def.fields.enableNull
    enableNull = enableNull && enableNull[i]
    let enableEdit = def.fields.enableEdit
    enableEdit = enableEdit && enableEdit[i]
    let row = {
      field_name: def.fields.names[i],
      field_value: v,
      field_type: def.fields.types[i],
      field_label: def.fields.labels[i],
      field_enableNull: enableNull,
      field_enableEdit: enableEdit
    }

    rows.push(row)
  }

  return rows
}

// 去空格函数
function trim (str) {
  return str.replace(/^(\s|\xA0)+|(\s|\xA0)+$/g, '')
}

// 格式化req数据函数
function composeUpdateDBReq (dbOp, name, keyValue, sqlstring) {
  return {
    cmd: 'update', // update, CMD.META.UPDATE
    data: {
      op: dbOp, // INSERT, UPDATE, DELETE
      name: name,
      id: keyValue,
      sql: sqlstring
    }
  }
}

//格式化编辑页面中传入的数据
function getMessage (cmd, rows, def, maxid) {
  return {
    cmd: cmd,
    name: def.name,
    table: def.table,
    title: def.label,
    key: def.fields.names[parseInt(def.keyIndex)], // key field name
    maxid: maxid,
    rows: rows
  }
}

// 根据页码数截取显示数据
function copySubRows (rows, pageIndex) {
  let start = pageIndex * PAGE_SIZE
  let end = (pageIndex + 1) * PAGE_SIZE
  return rows && rows.slice(start, end)
}

// import hintip from '@/components/hintip'
// 基础数据更新的接收函数
function metaUpdateRes(res, topicName, cmd) {
  cmd = res && res.data.op
  let dlg_tips = null
  let updateRes = null
  if (res.data.name === topicName) {
    if (res.code === 0) {
      let resultText = null
      switch (cmd) {
        case 'DELETE':
          resultText = '删除成功'
          break
        case 'INSERT':
          resultText = '添加成功'
          break
        case 'UPDATE':
          resultText = '修改成功'
          break
      }
      dlg_tips = resultText
      updateRes = true
    } else {
      dlg_tips = res.msg
      updateRes = false
    }
    let msg = {
      value: res.code === 0 ? 'success' : 'failure',
      tip: dlg_tips
    }
    dlg_tips && window.xdata.commit('metaStore/saveHintip', msg)
    return updateRes
  }
}
// 根据时间获取班次
function getShiftByTime(time) {
  let shiftId = null
  let timeArea = Array.from(xdata.state.metaStore.data.shift.values())
  timeArea.forEach(i =>{
    if(i.offset != 0){
      if((time >= i.start_time && time<= '23:59:59') || (time<= i.end_time && time >= '00:00:00')){
        shiftId = i.shift_id
      }
    }else{
      if(time >= i.start_time && time <= i.end_time){
        shiftId = i.shift_id
      }
    }
  })
  return shiftId
}
// 去重
function unique (list) {
    var result = [];
    for (var i = 0; i < list.length; i++) {
      if (i == 0) result.push(list[i]);
      let b = false;
      if (result.length > 0 && i > 0) {
        for (var j = 0; j < result.length; j++) {
          if (result[j].name == list[i].name) {
            b = true;
            //break;
          }
        }
        if (!b) {
          result.push(list[i]);
        }
      }
    }
    return result;
}
/**
 * [clone 深度克隆对象]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
function clone (obj) {
return JSON.parse(JSON.stringify(obj))
}

/*求点到直线的距离函数
* point1 线段起点
*  point2 线段终点
*  point3 所求点坐标
*/
function getPonitLine(point1,point2,point3) {
  let A = point2.y - point1.y;
  let B = point1.x - point2.x;
  let C = point2.x * point1.y - point1.x * point2.y;
  return Math.abs(A*point3.x + B*point3.y  + C)/(Math.sqrt(A*A + B*B))
}

// 获取传入直线的最近的路径
function getshortPath(pointObj) {
  let pathGather = clone(Array.from(xdata.state.metaStore.data.reader_path_combine.values()))
  pathGather = pathGather.map(item =>{
    let startPoint = item.start_point.split(',')
    item.start_point = {
      x: Number(Number(startPoint[0]).toFixed(1)),
      y: Number(Number(startPoint[1]).toFixed(1)),
    }
    let endPoint = item.end_point.split(',')
    item.end_point = {
      x: Number(Number(endPoint[0]).toFixed(1)),
      y: Number(Number(endPoint[1]).toFixed(1)),
    }
    let disAS = getPonitLine(item.start_point,item.end_point,pointObj.start_point)
    let disAE = getPonitLine(item.start_point,item.end_point,pointObj.end_point)
    item.distance = parseInt(disAS+disAE)
    return item
  })

  pathGather.sort(function (a,b) {
    return a.distance - b.distance
  });
  return pathGather[0]
}

// 对象过滤函数
function objfilter(oldObj,filterObj) {
  let keys = Object.keys(filterObj)
  let result = oldObj.filter(obj => {
    for (let i = 0; i < keys.length; i++) {
      let filterResult = filterObj[`${keys[i]}`].every(item => obj[`${keys[i]}`] !== item)
      if (filterResult) return
    }
    return obj
  });
  return result
}

// 对象排序
function objKeySort(obj, referObj) {
  let newObj = {};
  for (let i = 0; i < referObj.length; i++) {
    newObj[referObj[i]] = (obj[referObj[i]] || obj[referObj[i]] === 0) ? obj[referObj[i]] : ''
  }
  return newObj;
}

function getIpNum (ipAddress) {
  let ip = ipAddress.split(".")      
  let a = parseInt(ip[0])      
  let b = parseInt(ip[1])      
  let c = parseInt(ip[2])      
  let d = parseInt(ip[3])  
  let ipNum = a * 256 * 256 * 256 + b * 256 * 256 + c * 256 + d      
  return ipNum  
}

function isInnerIP (userIp,begin,end) {
  return (userIp >= begin) && (userIp <= end)
}

// 判断是内网还是外网访问
function judgeURL () {
  let userIP = xdata.userIP
  let reg = /(http|ftp|https|www):\/\//g
  let isInner = false
  if (userIP) {
    userIP = userIP.replace(reg, '')
    let reg1 = /\:+/g
    userIP = userIP.replace(reg1, '.')
    userIP = userIP.split('.')
    let ipAddress = `${userIP[0]}.${userIP[1]}.${userIP[2]}.${userIP[3]}`
    let ipNum = getIpNum(ipAddress)
    let ips = xdata.state.metaStore.data.ip_address && Array.from(xdata.state.metaStore.data.ip_address.values())
    ips = ips ? ips : []
    for (let i = 0; i < ips.length; i++) {
      let ip = ips[i]
      let begin = ip.ip_begin && getIpNum(ip.ip_begin)
      let end = ip.ip_end && getIpNum(ip.ip_end)
      isInner = isInnerIP(ipNum, begin, end)
      if (isInner) {
        return isInner
      }
    }
  }  
  return isInner
}

//修改页面条数
function dataNumberChange (update) {  
  if (window.localStorage.dataNumber) {
    let dataNumberParse = JSON.parse(window.localStorage.dataNumber)
    window.PAGE_SIZE =  dataNumberParse[0].dataNumber
  } else {
    let dataNumber = [{id:1,dataNumber:10}]  
    window.PAGE_SIZE = dataNumber[0].dataNumber
    let dataNumberStringify = JSON.stringify(dataNumber)
    window.localStorage.setItem('dataNumber', dataNumberStringify)
  }
  if (update) {
    let msg = {
      value: 'success',
      tip: '修改成功'
    }
    window.xdata.commit('metaStore/saveHintip', msg)
  }
}

function getAbsoluteUrl (url) {
  let a = document.createElement('a')
  a.href = url
  url = a.href
  return url
}

function getFilterSql (tableName,filterData) {
  let dse = ['staff_extend']
  let dve = ['vehicle_extend']
  let sql = ''
  let field = ''
  switch(true){
    case dse.includes(tableName):
        field = 'dse.'
        break;
    case dve.includes(tableName):
        field = 'dve.'
        break;
  }
  for (let item in filterData) {
    sql += ` and ${field}${item}=${filterData[item]}`
  }
  return sql 
}

function turnId (dis_type,event_type_id,obj_type_id,obj_id) {
  let value = (BigInt(dis_type) << BigInt(58)) | (BigInt(event_type_id) <<  BigInt(48)) | (BigInt(obj_type_id) << BigInt(40)) | (BigInt(2) << BigInt(36)) | BigInt(obj_id)
  return value
}

function editDetail (fieldName, value, detail, tableName, table) {
  let defs = edit_def[tableName] && edit_def[tableName].def ||xdata.state.metaStore.data[tableName], fields = defs.fields, names = fields.names, labels = fields.labels
  let index = names.indexOf(fieldName)
  if (index < 0 && table) {
    defs = xdata.metaStore.defs[table], fields = defs && defs.fields, names = defs && fields.names, labels = defs && fields.labels
    index = names && names.indexOf(fieldName)
  }
  let label = labels && labels[index]
  if (label) detail += `${label}:${value};`
  return detail
}
export {dealSpecialId, toJson, concatObject, formatElapsedTime, requestFullScreen, exitFullScreen, cancelCallCard, callCards, getRows, trim, composeUpdateDBReq, getMessage, metaUpdateRes, getShift, copySubRows, getShiftByTime,unique,clone,getPonitLine,getshortPath, objfilter, objKeySort, judgeURL, dataNumberChange, getAbsoluteUrl, getFilterSql, turnId, editDetail}
