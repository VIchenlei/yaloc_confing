import ol from 'openlayers'
import {ZOOM_LEVEL} from '../def/map_def.js'
import {mapIcon} from '../def/map_icon.js'
let vehiclePoint = mapIcon.vehiclePoint
let vehicleIcon = mapIcon.vehicle
let staffIcon = mapIcon.staff
let trackIcon = mapIcon.track

// 画图函数
function drawSymbol (attributes, source, map) {
  let type = null
  let geo = new ol.geom.Point([attributes.x, -attributes.y])
  let feature = new ol.Feature(geo)
  feature.setId(attributes['data-id'])
  feature.setProperties(attributes)

  let dataType = attributes['data-subtype']
  let state = attributes['card_state']
  let viewZoom = map.getView().getZoom()
  switch (dataType) {
    case 'staff':
      feature.setStyle(createLabelStyleStaff(feature, type, state, viewZoom, map))
      break
    case 'vehicle':
      feature.setStyle(createLabelStyle(feature, type, viewZoom, '', map))
      break
  }
  source.addFeature(feature)
  return feature
}
// 设置feature的style函数
function createLabelStyleStaff (feature, type, state, viewZoom, map) {
  let id = feature.get('data-id')
  let name = String(id)
  let view = map.getView()
  let p = {
    scale: 0.12,
    rotateWithView: true
  }
  let t = {
    fill: new ol.style.Fill({
      color: 'red'
    }),
    stroke: new ol.style.Stroke({
      lineCap: 'square',
      color: '#fff',
      miterLimit: 20,
      width: 10
    }),
    offsetY: -45
  }
  if (viewZoom < ZOOM_LEVEL.STAFFLEAVE) {
    view.setProperties({zoomLevel: 'STAFFSMALL'})
    p.src = staffIcon.point.img
    p.scale = 0.015
    t.name = ''
  } else {
    if (viewZoom >= 21 && viewZoom < 22) {
      p.scale = 0.08
    } else {
      p.scale = 0.12
    }
    view.setProperties({zoomLevel: 'MAX'})
    p.src = staffIcon.normal.img
    t.text = name
  }
  return new ol.style.Style({
    image: new ol.style.Icon(p),
    text: new ol.style.Text(t)
  })
}

// 设置feature的style函数
function createLabelStyle (feature, type, viewZoom, rotation, map) {
  let carcolor = 'green'
  let p = {
    rotateWithView: true,
    src: vehicleIcon[carcolor + 'car'].img,
    scale: 0.28
  }
  let t = {
    text: String(feature.get('data-number')),
    font: '12px',
    fill: new ol.style.Fill({
      color: 'red'
    }),
    stroke: new ol.style.Stroke({
      lineCap: 'square',
      color: '#fff',
      miterLimit: 20,
      width: 10
    }),
    offsetY: -35
  }
  return new ol.style.Style({
    image: new ol.style.Icon(p),
    text: new ol.style.Text(t)
  })
}

//转换路径得到坐标函数
function convertSVGPath2Coord (pathString) {
  let coordinates = []
  let paths = pathString.split(' ')
  for (let path of paths) {
    let point = path.split(',')
    let x = Number(point[0].substring(1))
    let y = -Number(point[1])
    coordinates.push([x, y])
  }

  return coordinates
}

// 获取绘线数据函数
function getPolylineBYPoints (data) {
  if (!data || data.length <= 0) {
    return { data: null, hopCount: 0, path: '' }
  }
  let pointList = new Array()
  let hopCount = data.length
  for (let i = 0; i < hopCount; i++) {
    let item = data[i]
    pointList.push([item.x, -item.y])
  }
  return { data: data, hopCount: hopCount, pointCol: pointList }
}

// 画线函数
function drawOLLine (layerSource, id, polCol, className, PatrolPath, row) {
  // layerSource.clear()
  let linestring = new ol.geom.LineString(polCol) // 坐标数组
  // var lineFeature = new ol.Feature(linestring,null,style_line);
  var lineFeature = new ol.Feature({
    geometry: linestring,
    finished: false
  })

  if (PatrolPath === 'PatrolPath') { // 巡检
    lineFeature.setId('hisTrackLine')
    lineFeature.setStyle(trackIcon['route'])
  } else if (PatrolPath === 'HintPath') {
    lineFeature.setId('hintPath')
    lineFeature.setStyle(trackIcon['hintPath'])
  } else if (PatrolPath === 'firstName') {
    lineFeature.setId('firstLine')
    lineFeature.setStyle(trackIcon['route'])
  } else if (PatrolPath === 'secondName') {
    lineFeature.setId('secondLine')
    lineFeature.setStyle(trackIcon['patrolPath'])
  } else {
    lineFeature.setStyle(trackIcon['patrolPath'])
    lineFeature.setId('hisTrackLinePatrolPath')
  }

  // 2、生成轨迹
  let startMarker = new ol.Feature({
    geometry: new ol.geom.Point(polCol[0])
  })
  let endMarker = new ol.Feature({
    geometry: new ol.geom.Point(polCol[polCol.length - 1])
  })
  if (PatrolPath === 'secondName') {
    startMarker.setStyle(trackIcon['start'])
    endMarker.setStyle(trackIcon['end'])
  } else {
    startMarker.setStyle(trackIcon['startMarker'])
    endMarker.setStyle(trackIcon['endMarker'])
  }

  if (row) {
    startMarker.setProperties({
      'id': id,
      'msg': row,
      'data-type': 'startMarker'
    })
    startMarker.setId('startMarker')
    endMarker.setProperties({
      'id': id,
      'msg': row,
      'data-type': 'endMarker'
    })
    endMarker.setId('endMarker')
  }
  layerSource.addFeature(lineFeature)
  layerSource.addFeature(startMarker)
  layerSource.addFeature(endMarker)
  return { lineFeature: lineFeature, lineLength: linestring.getLength() }
}

export {drawSymbol, convertSVGPath2Coord, getPolylineBYPoints, drawOLLine}
