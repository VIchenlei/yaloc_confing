<template>
  <div class="page-body">
    <div id="monitormap"></div>
    <div class="button-warp">
      <button v-if="!isPreview" class="btn" @click="goBack">返回主界面</button>
      <button v-if="handName === 'handAdd'" class="btn addHand" @click="handAdd">添加手工路径模板</button>
    </div>
    <div v-if="handName === 'map_upload'" class="uploadMapFile">
      <input type="file" webkitdirectory placeholder="上传地图文件">
      <button @click="uploadMapFile">上传文件</button>
    </div>
    <add-hispath v-if="handName === 'historyAdd'" :opts = "hispathData"></add-hispath>
    <tool-panel></tool-panel>
  </div>
</template>
<script>
import {mapState} from 'vuex'
import toolPanel from './tool-panel'
import addHispath from './add-hispath'
export default {
  props:['handName'],
  data () {
    return {
      topicName: null,
      chunkSize: 1024 * 1024,
      selectedFile: null,
      freader: null,
      fileLoad: true,
      filesUpload: new Map(),
      index: 0,
      files: null,
      isPreview: false,
      hispathData: null
    }
  },
  computed: {
    ...mapState({
      loadMap: state => state.mapStore.loadMap
    })
  },
  watch: {
    loadMap: function (result) {
      let id = xdata.state.mapStore.defaultMapID
      let map = xdata.state.mapStore.map
      let mapRow = xdata.state.mapStore.row
      let dom = this.$el.querySelector('#monitormap')
      xdata.dispatch('mapService/initMap', {
        id: id,
        map: map,
        mapRow: mapRow,
        dom: dom
      })
    },
    '$store.state.stateStore.topicName': {
      handler: function (result) {
        this.topicName = result
      }
    },
    '$store.state.stateStore.fileUploadMore': {
      handler: function (result) {
        this.uploadChunk(result)
      },
      deep: true
    },
    '$store.state.stateStore.isPreview': {
      handler: function (result) {
        this.isPreview = result
        this.$store.commit('stateStore/chaneInitRecompose')
      }
    },
    '$store.state.stateStore.historyPath': {
      handler: function (result) {
        this.hispathData = result.data
      },
      deep: true
    },
  },
  mounted () {
    if (window['xdata']) {
      let id = xdata.state.mapStore.defaultMapID
      let map = xdata.state.mapStore.map
      let mapRow = xdata.state.mapStore.row
      let dom = this.$el.querySelector('#monitormap')
      this.$store.dispatch('mapService/initMap', {
        id: id,
        map: map,
        mapRow: mapRow,
        dom: dom
      })
    }
  },
  methods: {
    // 上传文件函数
    uploadFile (file) {
      this.freader = new window.FileReader()
      this.freader.onload = (evt) => {
        xsocket.emit('FILE', {
          cmd: 'upload',
          data: {
            op: 'data',
            name: file.name,
            data: evt.target.result
          }
        })
      }
      xsocket.emit('FILE', {
        cmd: 'upload',
        data: {
          op: 'start',
          name: file.name,
          size: file.size,
          type: 'map' // map, staff, vehicle
        }
      })
    },
    storeFileUpload () {
      let file = this.files[this.index]
      this.uploadFile(file)
      this.filesUpload.set(file.name, {
        selectedFile: file,
        fileLoad: true
      })
    },

    // 上传地图文件函数
    uploadMapFile () {
      this.files = this.$el.querySelector('input').files
      if (this.files.length <= 0) {
        window.xdata.commit('metaStore/saveHintip', {
          value: 'failure',
          tip: '请选择要上传的文件夹'
        })
        return
      }
      this.$store.commit('stateStore/changeShowXhint', {
        showXhint: true,
        data: null
      })
      this.storeFileUpload()
    },
    // 上传地图文件后处理函数
    uploadChunk (data) {
      let name = data.name
      let file = this.filesUpload.get(name)
      let selectedFile = file && file.selectedFile
      // this.updateProgressBar(data['percent'])

      let nextStart = data['place'] * this.chunkSize // The Next Blocks Starting Position
      if (!selectedFile) return
      let nextEnd = nextStart + Math.min(this.chunkSize, (selectedFile.size - nextStart))
      let chunk = selectedFile.slice(nextStart, nextEnd)
      if (this.fileLoad) {
        this.freader.readAsBinaryString(chunk)
      }
      file.fileLoad = false
      this.filesUpload.delete(name)
      ++this.index
      if (this.index < this.files.length) {
        this.storeFileUpload()
      } else {
        this.index = 0
        this.$store.commit('stateStore/changeShowXhint', {
          showXhint: false,
          data: null
        })
        window.xdata.commit('metaStore/saveHintip', {
          value: 'success',
          tip: '上传成功'
        })
      }
    },
    // 返回主界面函数
    goBack () {
      if(this.handName === 'historyAdd' && this.$store.state.olMapTrackLayer.trackLayerSource.getFeatureById('hisTrackLine')){
        this.$store.commit('olMapTrackLayer/hideTrack')
      }
      this.$store.commit('olMapMeasureLayer/removeDrawInteraction')
      this.$store.commit('stateStore/changeShowMonitor',{showMonitor: false, handName: null})
    },
    // 添加手工路径函数
    handAdd () {
      this.$store.commit('stateStore/chaneInitRecompose')
      this.$store.commit('olMapMeasureLayer/mapMeasure', {geometry: 1})
    }
  },
  components: {
    addHispath,
    toolPanel
  }
}
</script>
<style lang="sass" scoped>
  @import '../../style/defs.sass'
  .page-body
    @include wh(100%, 100%)
    position: absolute
    flex: auto
    .uploadMapFile
      position: absolute
      left: 8.5rem
      top: 1.5rem
    .button-warp
      position: absolute
      top: 10px
      left: 10px
      .btn
        width: 5rem
      .addHand
        vertical-align: bottom
        width: 7rem
    #monitormap
      position: absolute
      @include wh(100%, 100%)
      background: url(../../assets/mapBGnew.png) center center
      background-size: cover
    .mapaside
      position: absolute
      z-index: 10
      height: 100%
      display: flex
</style>
