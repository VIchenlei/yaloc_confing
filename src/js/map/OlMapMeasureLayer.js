import ol from 'openlayers'
import {getPonitLine,getshortPath} from '../utils/utils'
export default {
  namespaced: true,
  state: {
    measureLayerSource: null,
    measureLayer: null,
    mode: null,
    draw: {interaction: 'yes'},
    featureId: 200,
    showAddpath: false,
    path_message:{
      path_data: null,
      valid: true
    },
    prePoint: null
  },
  mutations: {
    initMeasureLayer (state) {
      state.measureLayerSource = new ol.source.Vector()
      state.measureLayer = new ol.layer.Vector({
        source: state.measureLayerSource,
      })
      this.state.mapService.map.addEventListener('dblclick', function (e) {
        if (state.mode) {
          state.mode = null
          return false
        }
      }, false)
      this.state.mapService.map.addLayer(state.measureLayer)
    },

    removeDrawInteraction (state){
      this.state.mapService.map.removeInteraction(state.draw.interaction)
    },

    mapMeasure (state, msg) {
      if (state.draw.interaction) {
        this.state.mapService.map.removeInteraction(state.draw.interaction)
      }
      state.measureLayerSource.getFeatureById(state.featureId -1) && state.measureLayerSource.removeFeature(state.measureLayerSource.getFeatureById(state.featureId -1))
      this.commit('olMapMeasureLayer/addInteraction', msg.geometry)
    },
    drawstart (state) {
      state.mode = 'drawing'
    },
    drawend (state,evt) {
      let sketch = evt.feature
      let geom = sketch.getGeometry()
      let wkt = new ol.format.WKT()
      let wktGeo = wkt.writeGeometry(geom)
      sketch.setId(state.featureId)
      state.showAddpath = true
      let path = wktGeo.slice(11,-2).split(',').map((item,index)=>{
        item = item.split(' ')
        item[0] = Number(item[0]).toFixed(1)
        item[1] = Number(item[1]).toFixed(1)
        return item
      })
      let styles = [
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: '#0099ff',
            width: 3
          }),
        })
      ]
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
          state.path_message.valid = false
          styles.push(
            new ol.style.Style({
              geometry: new ol.geom.LineString([start, end]),
              stroke: new ol.style.Stroke({
                color: '#ff0000',
                width: 3
              })
            })
          )
        }
        state.measureLayer.setStyle(styles)
      }
      state.path_message.valid = true
      geom.forEachSegment(segmentFunction)
      state.path_message.path_data =path
      this.state.mapService.map.removeInteraction(state.draw.interaction)
      state.featureId = state.featureId + 1
      if (state.mode) {
        state.mode = null
        return false
      }
    },
    addInteraction (state,geomtry) {
      let self = this
      let type = (geomtry === 1 ? 'LineString' : 'Polygon')
      state.draw.interaction = new ol.interaction.Draw({
        source: state.measureLayerSource,
        type: type,
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: '#0099ff',
            // lineDash:[1,2,3,4,5,6],
            width: 3
          }),
          image: new ol.style.Circle({
            radius: 5,
            stroke: new ol.style.Stroke({
              color: 'rgba(0, 0, 0, 0.7)'
            }),
            fill: new ol.style.Fill({
              color: 'rgba(255, 255, 255, 0.2)'
            })
          })
        })
      })
      this.state.mapService.map.addInteraction(state.draw.interaction)
      state.draw.interaction.addEventListener('drawstart', function (evt) { self.commit('olMapMeasureLayer/drawstart', evt) }, false)
      state.draw.interaction.addEventListener('drawend', function (evt) { self.commit('olMapMeasureLayer/drawend', evt) }, false)
    },
    hideAdd(state){
      state.showAddpath = false
      if (this.state.mapService.preFeature) {
        this.state.mapService.preFeature.setGeometry(null)
      }
      state.measureLayerSource.getFeatureById(state.featureId -1) && state.measureLayerSource.removeFeature(state.measureLayerSource.getFeatureById(state.featureId -1))
      this.state.mapService.map.removeOverlay(this.state.mapService.map.getOverlayById(state.featureId -1))
    },
    changeShowAddpath(state){
      state.showAddpath = !state.showAddpath
    },
    removeDrawInteraction (state){
      this.state.mapService.map.removeInteraction(state.draw.interaction)
      state.measureLayerSource.getFeatureById(state.featureId -1) && state.measureLayerSource.removeFeature(state.measureLayerSource.getFeatureById(state.featureId -1))
      this.state.mapService.map.removeOverlay(this.state.mapService.map.getOverlayById(state.featureId -1))
    },

    changeValid (state, valid){
      state.path_message.valid = valid
    }
  }
}
