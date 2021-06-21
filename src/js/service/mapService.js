import ol from 'openlayers'
import { DEAFULT_MAP_MATRIXID } from '../def/map_def.js'
import {getPonitLine,getshortPath,judgeURL} from '../utils/utils'
import {getLastState, getInfoDef, getInfo} from '../utils/cardStoreDep.js'

const spliceLevel = 9
export default {
  namespaced: true,
  state: {
    mapID: -1,
    map: null,
    view: null,
    workspace: null,
    cardTips: null,
    showCardTips: false,
    showCardTipsID: null,
    mousePositionControl: null,
    select: null,
    modify: null,
    selectActive: false,
    modifyMessage:{
      modifyId: null,
      modifyData: null
    },
    preFeature: null,
    isInnerIP: false  
  },
  mutations: {
    storeMap (state, val) {
      state.map = val.map
      state.view = val.view
    },
    changeCareTips (state, msg) {
      state.cardTips = msg
      state.showCardTips = true
      state.showCardTipsID = msg.id
    },
    hideCardTips (state) {
      state.showCardTips = false
    },

    changeMouse (state, msg) {
      state.flag = msg.flag
      if (!state.mousePositionControl) {
        state.mousePositionControl = new ol.control.MousePosition({
          coordinateFormat: ol.coordinate.createStringXY(1),
          undefinedHTML: '0,0',
          target: document.getElementById('mouse-position')
        })
      }
      let map = state.map
      state.flag ? map.addControl(state.mousePositionControl) : map.removeControl(state.mousePositionControl)
    },

    changeSelectState (state, msg){
      state.selectActive = msg
      state.select.setActive(msg)
      state.modify.setActive(msg)
    },

    choosePreFeature (state){
      let features = state.select.getFeatures().getArray()
      if (state.selectActive && features && features.length>0){
        state.preFeature = features[0]
      }
    }
  },
  actions: {
    initMap ({state, commit, dispatch}, rows) {
      let self = this
      let mapID = rows.id
      state.isInnerIP = judgeURL()
      let mapDef = rows.map
      let row = rows.mapRow
      let mapURL = mapDef.tileWmsOpts.url
      mapDef.tileWmsOpts.url = state.isInnerIP && row ? row.inner_url : mapURL
      let container = rows.dom
      let containerName = 'monitormap'
      let chooseMap = this.state.mapStore.gisMap && this.state.mapStore.gisMap.get(mapID)
      let projExtent = ol.proj.get('EPSG:3857').getExtent()
      let startResolution = ol.extent.getWidth(projExtent) / 256
      let resolutions = new Array(22)

      for (var i = 0, len = resolutions.length; i < len; ++i) {
        resolutions[i] = startResolution / Math.pow(2, i)
      }
      let extent = [2000, -1500, 12000, 4000] // 地图范围 默认高河地图范围
      if (row) {
        extent = [parseInt(row.minX), parseInt(row.minY), parseInt(row.maxX), parseInt(row.maxY)]
      } else if (chooseMap) {
        extent = [parseInt(chooseMap.minX), parseInt(chooseMap.minY), parseInt(chooseMap.maxX), parseInt(chooseMap.maxY)]
      }
      let tileGrid = new ol.tilegrid.TileGrid({
        extent: extent,
        resolutions: resolutions,
        tileSize: [512, 256]
      })
      let tileWmsOpts = mapDef.tileWmsOpts
      let wmsLayer
      tileWmsOpts.tileGrid = tileGrid
      let mapType = mapDef.type
      if (!mapDef.type) {
        let str = mapDef.tileWmsOpts.url
        mapType = mapDef.tileWmsOpts.url.includes('wms')
        mapType = mapType ? 'wms' : 'wmts'
      }
      chooseMap = { map_type: mapType }
      if (mapType === 'wmts') {
        chooseMap.url = tileWmsOpts.url
        chooseMap.layers = tileWmsOpts.params.LAYERS
        chooseMap.matrixId = DEAFULT_MAP_MATRIXID
      }

      if (chooseMap.map_type === 'wms') {
        wmsLayer = new ol.layer.Tile({
          source: new ol.source.TileWMS(tileWmsOpts)
        })
      } else if (chooseMap.map_type === 'wmts') {
        let matrixIds = []
        let resolution = []
        let startResolutions = ol.extent.getHeight(extent) / 256
        for (let i = 0; i <= spliceLevel; i++) {
          matrixIds[i] = chooseMap.matrixId + i
          resolution[i] = startResolutions / Math.pow(2, i)
        }
        let matrixSet = chooseMap.matrixId && chooseMap.matrixId.slice(0, chooseMap.matrixId.indexOf(':'))
        wmsLayer = new ol.layer.Tile({
          source: new ol.source.WMTS({
            url: chooseMap.url,
            layer: chooseMap.layers,
            tileGrid: new ol.tilegrid.WMTS({
              extent: extent,
              resolutions: resolution,
              matrixIds: matrixIds,
              tileSize: [256, 256]
            }),
            matrixSet: matrixSet,
            format: 'image/png',
            projection: 'EPSG:3857'
          })
        })
      } else {
        console.warn('unknow map type!')
      }
      window.wmsLayer = wmsLayer

      let view = new ol.View(mapDef.viewOpts)
      state.select = new ol.interaction.Select();
      state.modify = new ol.interaction.Modify({
          features:state.select.getFeatures()
      });
      /*
        原因：非托管层的zIndex为无穷大
        v5中的解决方法
        select.getOverlay().setZIndex(0);
      */
      state.select.setActive(state.selectActive)
      state.modify.setActive(state.selectActive)
      let m = {
        layers: [wmsLayer],
        overlays: [], // overlays: [tooltips],
        target: containerName,
        view: view,
        controls: ol.control.defaults({
          attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
            collapsible: false
          })
        }),
        interactions: ol.interaction.defaults({doubleClickZoom :false}).extend([state.select,state.modify])
      }
      let olmap = new ol.Map(m)
      let zoomslider = new ol.control.ZoomSlider()
      let ele = document.createElement('div')
      let img = document.createElement('img')
      img.src = '../../../static/image/north.png'
      ele.innerHTML = img
      document.querySelector('.ol-compass').innerText = ''
      let resetNorth = new ol.control.Rotate({
        autoHide: false,
        label: img
      })
      olmap.addControl(zoomslider)
      olmap.addControl(resetNorth)

      olmap.on('pointermove', function (e) {
        let pixel = olmap.getEventPixel(e.originalEvent)
        let hit = olmap.hasFeatureAtPixel(pixel)
        olmap.getTargetElement().style.cursor = hit ? 'pointer' : ''
      })
      commit('storeMap', {
        mapID: mapID,
        map: olmap,
        view: view
      })
      olmap.addEventListener('dblclick', (evt) => {
        let features = state.select.getFeatures().getArray()
        if (state.selectActive && features && features.length>0){
          state.preFeature = features[0]  
          let valid = true
          let segmentFunction = function (start, end) {
            let obj = {
              start_point:{
                x: start[0],
                y: start[1]
              },
              end_point:{
                x: end[0],
                y: end[1]
              }
            }
            let shortPath = getshortPath(obj)
            let startDistance = getPonitLine(shortPath.start_point,shortPath.end_point,obj.start_point)
            let endDistance = getPonitLine(shortPath.start_point,shortPath.end_point,obj.end_point)
            if(startDistance > 2 ||  endDistance > 2){
              valid = false
            }
          }
          if (!features[0].getGeometry()) return 
          features[0].getGeometry().forEachSegment(segmentFunction)
          self.commit('olMapMeasureLayer/changeValid',valid)
          let coords = features[0].get("geometry").getCoordinates()
          state.modifyMessage.modifyId = state.preFeature.getId()
          state.modifyMessage.modifyData = coords.map(item => {
            item[0] = Number(item[0].toFixed(2))
            item[1] = Number(item[1].toFixed(2))
            return item
          })
          // commit('changeSelectState', false)
        }
      })
      state.modify.on('modifystart', (evt) => {
        state.select.setActive(false) 
      })

      this.commit('olMapCardLayer/initLayers')
      this.commit('olMapMeasureLayer/initMeasureLayer')
      this.commit('olMapTrackLayer/initTrackLayer')
    }
  }
}
