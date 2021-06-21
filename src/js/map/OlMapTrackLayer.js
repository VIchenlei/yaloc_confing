import ol from 'openlayers'
import {getPolylineBYPoints, drawOLLine} from '../utils/OlMapUtils.js'

export default {
  namespaced: true,
  state: {
    trackLayerSource: null,
    trackLayer: null,
  },
  mutations: {
    initTrackLayer (state) {
      state.trackLayerSource = new ol.source.Vector()
      state.trackLayer = new ol.layer.Vector({source: state.trackLayerSource})
      state.trackLayer.name = 'tracklayer'
      this.state.mapService.map.addLayer(state.trackLayer)
    },
    drawWholeTrack (state, message) {
      let msg = message.msg
      let PatrolPath = message.PatrolPath
      let cardID = msg.cardID
      let data = msg.rows
      let path = getPolylineBYPoints(data)
      if (path.hopCount > 0) {
        let id = `HISTORY_TRACK_${cardID}`
        track = drawOLLine(state.trackLayerSource, id, path.pointCol, 'track-whole', PatrolPath)
      }
      let track = { 
        pathDom: track.lineFeature, 
        pathLength: track.lineLength, 
        pathDef: path 
      }
      state.trackWhole = { cardID: cardID, pathDef: track.pathDef, pathDom: track.pathDom, pathLength: track.pathLength }
    },
    hideTrack(state){
      state.trackLayerSource.removeFeature(state.trackLayerSource.getFeatureById('hisTrackLine'))
      if (this.state.mapService.preFeature) {
        this.state.mapService.preFeature.setGeometry(null)
      }
      if (state.trackLayerSource.getFeatureById('startMarker') && state.trackLayerSource.getFeatureById('endMarker')) {
        state.trackLayerSource.removeFeature(state.trackLayerSource.getFeatureById('startMarker'))
        state.trackLayerSource.removeFeature(state.trackLayerSource.getFeatureById('endMarker'))
      }
    }
    ,
    drawHintLine (state, message) {
      if (state.trackLayerSource.getFeatureById('hintPath')){
        state.trackLayerSource.removeFeature(state.trackLayerSource.getFeatureById('hintPath'))
      }
      let msg = message.msg
      let PatrolPath = message.PatrolPath
      let data = msg.rows
      let path = getPolylineBYPoints(data)
      if (path.hopCount > 0) {
        let id = `HINT_LINE`
        let track = drawOLLine(state.trackLayerSource, id, path.pointCol, 'hint-line', PatrolPath)
      }
    },
    hideHintTrack(state){
      if (state.trackLayerSource.getFeatureById('hintPath')) {
        state.trackLayerSource.removeFeature(state.trackLayerSource.getFeatureById('hintPath'))
      }
    }
  }
}
