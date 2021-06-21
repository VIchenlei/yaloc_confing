<template>
    <div class="result-panel">
        <div class="track-list-panel" v-if="hasTracks">
            <div :class = "active === index ? 'track-tag active' : 'track-tag'" v-for="(row,index) in tracks" :key="index" @click="choosePath(row,index)">
                <!-- <div class="track-tag"> -->
                    <p :cardID="row.card_id">
                    <span>{{row.card_id}}</span>
                    </p>
                    <p>开始时间：{{new Date(row.start_time).format('yyyy-MM-dd hh:mm:ss')}}</p>
                    <p>结束时间：{{new Date(row.end_time).format('yyyy-MM-dd hh:mm:ss')}}</p>
                    <p :class = "Number(row.duration.split(':')[0]) > 10 ? 'warnColor' : ''">时长：{{row.duration}}</p>
                    <!-- <p>起点：{{row.startp}}</p>
                    <p>终点：{{row.endp}}</p> -->
                <!-- </div> -->
            </div>
        </div>
        <blankMessage :message="listMessage" class="blank-message" v-if="!hasTracks"></blankMessage>
    </div>
</template>
<script>
import blankMessage from '@/components/blank-message'
import {formatElapsedTime} from '../js/utils/utils.js'

export default {
    // props:['opts'],
    data () {
        return {
            listMessage: '请先输入条件查询轨迹数据',
            tracks: null,
            hasTracks :false,
            IdArr: null,
            active: -1,
            chooseTrack: null
        }
    },

    computed: {

    },
    watch: {
        '$store.state.socketStore.reptShowResult': {
            handler: function (result) {
                if(result.def.name === 'TrackList'){
                    this.$store.commit('stateStore/changeShowXhint',{
                        showXhint: false,
                        data: null
                    })
                    this.processTrackListResult(result)
                }
                
            },
            deep: true
        }
    },
    mounted () {
        
    },
    components: {
        blankMessage
    },
    methods: {
        // 接收查询数据，处理数据
        processTrackListResult (ds) {
            if(ds.rows && ds.rows.length > 0){
                this.hasTracks = true
                this.tracks = this.formatTrackListCheckout(ds.rows)
                this.IdArr = ds.rows.map(item => item.id)
                this.tracks = Array.from(this.tracks.values())[0]
            }else{
                this.hasTracks = false
            }
            if(this.$store.state.olMapTrackLayer.trackLayerSource.getFeatureById('hisTrackLine')){
                this.$store.commit('olMapTrackLayer/hideTrack')
            }
        },
        // 处理具体路径数据函数
        formatTrackListCheckout (tracks) {
            let ts = new Map()
            for (let i = 0, len = tracks.length; i < len; i++) {
                let track = tracks[i]
                let cardID = track.card_id
                let name = null
                let vehicleID = track.vehicle_id
                let staffID = track.staff_id
                if (vehicleID) {
                name = xdata.state.metaStore.data.vehicle.get(vehicleID).name
                } else if (staffID) {
                name = xdata.state.metaStore.data.staff.get(staffID).name
                }
                let recs = ts.get(name)
                if (!recs) {
                recs = []
                ts.set(name, recs)
                }
                if (!track.end_time) { // 考勤没有结束时间
                    track.end_time = this.getEndTime(track.start_time)
                }
                let durationTime = new Date(track.end_time).getTime() - new Date(track.start_time).getTime()
                track.duration = formatElapsedTime(durationTime)
                track.startp = track.sname + track.sdir + (track.sdis ? track.sdis.toFixed(1) + '米' : '')
                track.endp = track.ename + track.edir + (track.edis ? track.edis.toFixed(1) + '米' : '')
                recs.push(track)
            }
            return ts
        },
        // 获取结束时间
        getEndTime (str) { 
            let time = new Date(Date.parse(str))
            time = time.getTime() + 8 * 60 * 60 * 1000
            return new Date(time).format('yyyy-MM-dd hh:mm:ss')
        },

        // 选择某段路径函数
        choosePath (row,index) {
            this.$store.commit('stateStore/changeShowXhint',{
                showXhint: true,
                data: null
            })
            if(this.$store.state.olMapTrackLayer.trackLayerSource.getFeatureById('hisTrackLine')){
                this.$store.commit('olMapTrackLayer/hideTrack')
            }
            this.active = index
            this.chooseTrack = row
            let startTime = new Date(row.start_time).format('yyyy-MM-dd hh:mm:ss')
            let endTime = new Date(row.end_time).format('yyyy-MM-dd hh:mm:ss')
            let objID = row.staff_id
            let sql = `select bt.staff_id, bt.card_id, begin_time, last_time, speed, begin_pt, hl.area_id, direction from his_location_staff_ hl,dat_staff_extend bt where hl.obj_id=bt.staff_id and bt.staff_id= ${objID} and begin_time >= "${startTime}" and begin_time <= "${endTime}" order by begin_time;`
            let message = {
                cmd: 'query',
                data: {
                name: 'TrackData',
                pageSize: 5000,  // 最近5000条
                pageIndex: 0,
                sql: sql
                }
            }
            this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
                cmd: 'REPT-FETCH-DATA',  
                data:{
                    data: message,
                    cmd: 'REPT',
                    def: {
                    name: 'addhisPath'
                    },
                }
            })
        },
    }
}
</script>
<style lang="sass" scoped>
    .result-panel
        display: flex
        flex-flow: column nowrap
        flex: 1 !important
        overflow-y: auto
        overflow-x: hidden
        padding: 0
        font-size: .9rem
        .track-list-panel
            display: flex
            flex-flow: column
            flex: auto
            overflow-y: scroll
            margin-right: -20px
            background: #082863
            .track-group-title 
                height: 2rem
                line-height: 2rem
                text-align: center
                background: #f5f5f5
            .track-tag
                justify-content: space-between
                align-items: center
                flex-flow: column
                cursor: pointer
                border: 1px solid #f5f5f5
                padding: 1rem
                color: #999999
                &.active 
                    background: #009fff
                    color: #051d47
                &:hover
                    border: 1px solid #09F
                p
                    width: 95%
                    display: flex
                    span:nth-child(2)
                        flex: 2
                    .track-time
                        display: flex
                        flex-direction: column
                        padding-left: 15%
                        &:nth-child(2),&:nth-child(3)
                            padding-left: 24%
    .warnColor
        color: red
</style>
