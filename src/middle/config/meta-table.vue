<template>
    <div>
        <div class="control" >
            <span @click="controlEdit($event)" name="INSERT" v-show="!hiddenAdd.includes(tableName)" >新增</span>
            <span @click="deleteReader($event)" v-show="tableName === 'rpt_att_staff'">强制删除</span>
            <span @click="deleteAll($event)" name="DELETEALL" v-show="tableName === 'alarm_mange' || tableName === 'his_leader_arrange_2'" >批量删除</span>
            <span @click="importFile" v-show="tableName === 'alarm_mange'" >批量导入</span>
            <span @click="importFile" class="hint--bottom-left" data-needdisplay='0' data-value='all' v-show="tableName === 'staff_extend' || tableName === 'vehicle_extend'" aria-label='导入全部黑名单'>
                <img class='pointImg' src="../../assets/import.png" alt="">
            </span>
            <span @click="importFile" class="hint--bottom-left" data-value='part' data-needdisplay='1' v-show="tableName === 'staff_extend'" aria-label="导入部分白名单">
                <img class='pointImg' src="../../assets/partImport02.png" alt="">
            </span>
            <span @click="importFile" class="hint--bottom-left" data-value='part' data-needdisplay='0' v-show="tableName === 'staff_extend' || tableName === 'vehicle_extend'" aria-label="导入部分黑名单">
                <img class='pointImg' src="../../assets/partImport.png" alt="">
            </span>
            <span @click="askFile" class="hint--bottom-left" name='csv' v-show="tableName === 'staff_extend' || tableName === 'vehicle_extend'"  aria-label="批量导出黑名单">
                <img class='pointImg' src="../../assets/export.png" alt="">
            </span>
        </div>
        <search-list v-if="searchListShow()" :def="def" :tableName="tableName" :ref="tableName"></search-list>
        <div class="content-panel" v-if="hasdata">
            <table id="meta-table">
                <thead>
                    <tr>
                        <th v-for="(label, index) in labels" :key="index" v-if="label !== '唯一ID标识' && label !== '事件ID'">
                            {{label}}
                            <span @click.stop="checkAll" v-if="label==='是否显示'||label === '选择'" class="check">
                                <!-- <label class="show-label">正式</label> -->
                                <svg class="icon">
                                    <use :xlink:href="checkAllStatus ? '#icon-check' : '#icon-check-no'"></use>
                                </svg>
                            </span>
                            <!-- <span v-if="label === '选择'" class="check">
                                <input type="checkbox" name="selectAll" id="selectAll" @change="checkAll" :checked="checked">
                            </span> -->
                        </th>
                        <th class="no-print">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(row, index) in subRows" :key="index" :keyName="index">
                        <td v-for="(value, names) in row" :key="names" v-if="chooseShow(names)">
                            <span v-if="names !== 'need_display' && names !== 'check_state'" class='detailNumber' data-type="names">{{getValue(value, names)}}</span>
                            <input v-if="names == 'need_display'" :value="tableName == 'staff_extend' ? row.staff_id : row.vehicle_id" class="checkbox" type="checkbox" :checked="value === 1 ? 'checked' : ''" @click="changeBoxStatus">        
                            <!-- <input v-if="names == 'check_state'" class="checkbox" type="checkbox" @change="chooseInput" @checked="selectInputs.get(row.id)"> -->
                            <input v-if="names == 'check_state'" class="checkbox" type="checkbox" @change="chooseInput" :checked="selectInputs.get(tableName === 'alarm_mange' ? row.id+'AND'+row.cur_time : `${row.staff_id}${row.shift_id}${new Date(row.duty_date).getTime()}`)">
                        </td>
                        <td class="no-print">
                            <span @click="edit($event, row)" class="edit hint--top-left" v-show="tableName != 'his_virtual_path'" aria-label="编辑">
                                <svg class="icon black-icon"><use xlink:href="#icon-edit"></use></svg>
                            </span>
                            <span @click="edit($event, row)" class="delete hint--top-left" v-show="tableName != 'staff_extend' && tableName != 'vehicle_extend' && tableName != 'user' && tableName != 'number_bars' && tableName != 'area'" aria-label="删除">
                                <svg class="icon black-icon"><use xlink:href="#icon-delete"></use></svg>
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <!-- <pagination class="pagination" v-if="hasdata" pageData :totalpage="totalPage" :pageindex="pageIndex" :tablename="tableName"></pagination> -->
        <pagination class="pagination" v-if="hasdata" :pageData = "pageData"></pagination>
        <blankMessage data-is="blank-message" message="当前数据库中没有相关记录！请查证后再试。" class="blank-message" v-if="!hasdata"></blankMessage>
    </div>
</template>

<script>
    import {mapState} from 'vuex'
    import blankMessage from '../../components/blank-message'
    import searchList from './search-list'
    import reptQuery from '@/js/def/rept_query.js'
    import numberTurnText from '@/js/def/number_turn_text.js'
    import {importFileDef} from '@/js/def/import_file_def.js'
    import {getNameByID, getCardBindObjectInfo} from '@/js/utils/metaStoreDep.js'
    import {composeUpdateDBReq, getRows, getFilterSql} from '@/js/utils/utils.js'
    // const PAGE_SIZE = 10
    const HIDDENADD = ['staff_extend', 'vehicle_extend', 'his_virtual_path', 'user', 'rpt_att_staff', 'number_bars', 'area']
    export default {
        props:['tableData'],
        data () {
            return {
                labels: null,
                rows: null,
                subRows: null,
                def: null,
                hasdata: false,
                totalPage: -1,
                pageIndex: 0,
                maxid:0,
                name: null,
                tableName: null,
                searchQuery: reptQuery,
                checkAllStatus: true,
                hiddenAdd: HIDDENADD,
                pageData: null,
                selectInputs: new Map(),
                notChecked: new Map(),
                isSelectAll: false
            }
        },
        computed: {
            ...mapState({
                checked: state => state.stateStore.alarmCheckAllStatus
            })
        },
        methods: {
            //  根据传入的value与name获取显示的value值
            getValue (value, name) {
                if (name === 'virtual_path_id' && this.tableName === 'virtual_path') {
                    return value
                } else if (name === 'staff_id' && this.tableName === 'rpt_att_staff') {
                    return value
                } else if (name === 'area_id' && this.tableName === 'area') {
                    return value
                } else if (name === 'obj_id' && this.tableName === 'alarm_mange') {
                    return value
                }
                let turnValue = this.TurnTxt(name,getNameByID(name, value, window.xdata))
                return turnValue
            },
            //将数字修改成文字的参数的参数
            TurnTxt (nameTxt, value) {
                if (numberTurnText.hasOwnProperty(this.tableName)) {
                    let hasTurnName = numberTurnText[this.tableName][nameTxt]
                    if (hasTurnName) return hasTurnName[value]
                }
                return value
            },
            //  编辑函数
            edit (evt, data) {
                let target = evt.currentTarget
                let name = target.getAttribute('class')
                let controlName = name.includes('edit') ? 'UPDATE' : 'DELETE'
                if(this.tableName === 'virtual_path' && controlName === 'UPDATE' && data.type == 1){
                    this.$store.commit('stateStore/changeShowMonitor',{showMonitor: true, handName: 'updatePath'})
                    this.$store.commit('stateStore/changeUpdatePath', {
                        showUpdatePath: true,
                        tableName: this.tableName,
                        data: data
                    })
                }else if(this.tableName === 'virtual_path' && controlName === 'UPDATE' && data.type == 0){
                    this.$store.commit('stateStore/changeShowMonitor',{showMonitor: true, handName: 'historyAdd'})
                    this.$store.commit('stateStore/changeHistoryPath', {
                        data: data
                    })
                }else if(this.tableName === 'rpt_att_staff' && controlName === 'UPDATE'){
                    this.$store.commit('stateStore/changeUpdateOldPath', {
                        showUpdateOldPath: true,
                        tableName: this.tableName,
                        data: data
                    })
                }else if (this.tableName === 'alarm_mange') {
                    this.$store.commit('stateStore/changeAlarmDialog', {
                        type: true, 
                        name: this.tableName, 
                        controlName: controlName, 
                        row: data
                    })
                }else{
                    this.$store.commit('stateStore/changeDialogEdit', {
                        type: true, 
                        name: this.tableName, 
                        controlName: controlName, 
                        row: data
                    })
                }
            },
            //  初始化函数
            init (msg) {
                this.def = msg ? msg.def : null
                if (!this.def) {
                    this.hasdata = false
                    return
                }
                this.totalPage = Math.ceil(msg.total / PAGE_SIZE)
                this.pageIndex = msg.pageIndex
                this.title = msg.def.label
                this.tableName = msg.def.name
                this.pageData = {
                    pageIndex : this.pageIndex,
                    totalPage : this.totalPage,
                    tableName : this.tableName
                }
                this.labels = msg.def.fields.labels
                this.rows = msg.rows
                this.maxid = msg.maxid
                this.hasdata = !!(this.rows && this.rows.length > 0)
                if (this.hasdata) {
                    this.subRows = this.rows
                    if (this.tableName === 'alarm_mange' || this.tableName === 'his_leader_arrange_2') {
                        this.checkAllStatus = this.checked
                        // this.chooseAllOrNot()
                        this.initChoose()
                    } else {
                        this.rows.some(item => {
                            if(item.need_display  == 0){
                                this.checkAllStatus = false
                                return true
                            }else{
                                this.checkAllStatus = true
                            }
                        })
                    } 
                }
            },
            //  新增函数
            controlEdit (evt) {
                if(this.tableName === 'virtual_path'){
                    this.$store.commit('stateStore/changeShowPathManage')
                } else if (this.tableName === 'alarm_mange') {
                    let target = evt.target
                    let name = target.getAttribute('name')
                    this.$store.commit('stateStore/changeAlarmDialog', {
                        type: true,
                        name: this.tableName,
                        controlName: name,
                        row: null
                    })
                }else if (this.tableName === 'his_leader_arrange_2' || this.tableName === 'his_leader_arrange_1') {
                    let target = evt.target
                    let name = target.getAttribute('name')
                    this.$store.commit('stateStore/changeBindPath', {
                        type: true, 
                        name: this.tableName, 
                        controlName: name, 
                        row: null
                    })
                }else{
                    let target = evt.target
                    let name = target.getAttribute('name')
                    this.$store.commit('stateStore/changeDialogEdit', {
                        type: true,
                        name: this.tableName,
                        controlName: name,
                        row: null
                    })
                }
            },
            deleteReader(evt) {
                this.$store.commit('stateStore/changeDialogEdit', {
                    type: true, 
                    name: 'rpt_att_staff_all', 
                    controlName: 'DELETE', 
                    row: null
                })
            },
            deleteAll (event) {
                let deleteArr = this.rows.filter(item => item.check_state === true)
                let querySql = this.$refs[this.tableName] && this.$refs[this.tableName].sqlString
                this.$store.commit('stateStore/changeShowDeleteAllHint', {
                    showDeleteAllHint: true,
                    msg:{
                        data: deleteArr,
                        selectDatas: {
                            isSelectAll: this.isSelectAll,
                            notChecked: this.notChecked,
                            selectInputs: this.selectInputs,
                            querySql: querySql,
                            tableName: this.tableName
                        }
                    }
                        
                })
            },
            //  用于人车管理中，按照部门控制人车是否显示
            checkAll(evt) {
                if (this.tableName === 'alarm_mange' || this.tableName === 'his_leader_arrange_2') {
                    this.chooseAllOrNot(evt)
                } else {
                    // let fuzzysearch = this.$refs[this.tableName].$refs['dept_id'][0].$el
                    // let deptID = fuzzysearch.querySelector('#searchinput').value
                    // if (!deptID) return this.checkSpell('请选择部门！')
                    this.$store.commit('stateStore/changeShowHint',{
                        checkStatus: this.checkAllStatus
                    })
                }
            },

            //  控制人车是否显示sql函数
            checkAllSql(){
                console.log(this.tableName,this.$refs[this.tableName].$refs)
                let deptfuzzysearch = this.$refs[this.tableName].$refs['dept_id'][0].$el, condition = 'where 1=1'
                let deptID = deptfuzzysearch.querySelector('#searchinput').value
                let deptCkfuzzysearch = this.$refs[this.tableName].$refs['dept_id_ck'][0].$el
                let deptCkID = deptCkfuzzysearch.querySelector('#searchinput').value
                let keyName = this.tableName === 'staff_extend' ? 'staff_id' : 'vehicle_id'
                let svfuzzysearch = this.$refs[this.tableName].$refs[keyName][0].$el
                let svID = svfuzzysearch.querySelector('#searchinput').value

                if (deptID) {
                    deptID = Number(deptfuzzysearch.querySelector('#searchinput').getAttribute('data-type'))
                    condition += ` and se.dept_id = ${deptID}`
                }   
                if (deptCkID) {
                    deptCkID = Number(deptCkfuzzysearch.querySelector('#searchinput').getAttribute('data-type'))
                    condition += ` and se.dept_id_ck = ${deptCkID}`
                }
                if (svID) {
                    svID = Number(svfuzzysearch.querySelector('#searchinput').getAttribute('data-type'))
                    condition += ` and s.${keyName} = ${svID}`
                }
                let displayValue = this.checkAllStatus ? 1 : 0, sql
                if (this.tableName === 'staff_extend') {
                    sql = `update dat_staff_extend se inner join dat_staff s on se.staff_id = s.staff_id set se.need_display = ${displayValue}, se.user_id = '${xdata.username}' ${condition};`
                } else if (this.tableName === 'vehicle_extend') {
                    sql = `update dat_vehicle_extend se inner join dat_vehicle s on se.vehicle_id = s.vehicle_id set se.need_display = ${displayValue} ${condition};`
                }
                let req = composeUpdateDBReq('UPDATE', this.tableName, '', sql)
                this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
                    cmd: 'META-UPDATE-DB',
                    data: req
                })
            },
            //  每个人车是否显示sql函数
            changeBoxStatus(evt){
                let detail = ''
                let ele = evt.target
                let value, sql, type_id = null
                value = ele.checked ? 1 : 0
                type_id = this.tableName === 'staff_extend' ? 'staff_id' : 'vehicle_id'
                let labelName = type_id === 'staff_id' ? '员工编号' : '车辆编号'
                detail = `${labelName}:${ele.value};是否显示:${value}`
                if (this.tableName === 'staff_extend') {
                    sql = `update dat_${this.tableName} set need_display =${value}, user_id ='${xdata.username}' where ${type_id} =${Number(ele.value)};`
                }else{
                    sql = `update dat_${this.tableName} set need_display =${value} where ${type_id} =${Number(ele.value)};`
                }
                let req = composeUpdateDBReq('UPDATE',this.tableName, detail, sql)
                this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
                    cmd: 'META-UPDATE-DB',
                    data: req
                })
                // this.$refs[this.tableName].queryDB ()
            },
            //导入文件函数
            importFile (evt) {
                let def = null
                if(importFileDef.hasOwnProperty(this.tableName)){
                    def = importFileDef[this.tableName]
                }else{
                    def = this.def
                }
                let target = evt.currentTarget
                let value = target.getAttribute('data-value')
                let needDisplay = target.getAttribute('data-needdisplay')
                let isAll = false
                if (value === 'all'){
                    isAll = true
                } else if (value === 'part'){
                    isAll = false
                }
                let rows = getRows(null, def, this.maxid)
                let msg = this.composeImportDataMessage('IMPORT-DATA', rows, def, isAll, needDisplay)
                this.$store.commit('stateStore/changeImportFileMsg', {
                    showImportFile: true,
                    data: msg
                })
            },
            // 格式化传入到import-file-dialog的数据
            composeImportDataMessage (cmd, rows, def, isAll, needDisplay) {
                return {
                    cmd: cmd,
                    def: def, 
                    maxid: this.maxid,
                    rows: rows,
                    isAll: isAll,
                    needDisplay: needDisplay
                }
            },
            getAskFileSql (def) {
                let names = def.fields.names
                let fstring = names.join(',')
                let keyIndex = def.fields.names[def.keyIndex]
                let filterSql = ''
                let filterData = this.$parent.filterValue
                if (filterData) {
                    filterSql = getFilterSql(this.tableName,filterData)
                }
                let sql = null
                if (this.tableName === 'staff_extend'){
                    sql = `select dse.staff_id,ds.name,dse.dept_id, dse.need_display from dat_staff_extend dse left join dat_staff ds on dse.staff_id = ds.staff_id where dse.need_display = 0${filterSql} order by ${keyIndex};`
                } else if (this.tableName === 'vehicle_extend'){
                    sql = `select dve.vehicle_id,dv.name,dve.dept_id, dve.need_display from dat_vehicle_extend dve left join dat_vehicle dv on dve.vehicle_id = dv.vehicle_id where dve.need_display = 0${filterSql} order by ${keyIndex};`
                } else{
                    sql = `select ${fstring} from ${def.table} order by ${keyIndex};`
                }
                return sql
            },
            askFile (evt) {
                this.$store.commit('stateStore/changeShowXhint',{showXhint: false, data: null})
                this.$store.commit('stateStore/changeShowXhint',{showXhint: true, data: null})
                let opName = evt.currentTarget.getAttribute('name')
                let def = null
                if(importFileDef.hasOwnProperty(this.tableName)){
                    def = importFileDef[this.tableName]
                }else{
                    def = this.def
                }
                let sqlString = this.getAskFileSql(def)
                let name = this.tableName
                let reptTime = new Date().getTime()
                let msg = {
                    cmd: 'file',
                    exprList: [],
                    name: name,
                    labels: def.fields.labels,
                    title: def.label,
                    namesInShort: def.fields.names,
                    types: def.fields.types,
                    fileType: opName,
                    reptIndex: reptTime,
                    sql: sqlString,
                    userName: xdata.userName
                }
                this.$store.dispatch('socketStore/registerGlobalEventHandlers', {
                    cmd: 'REPT-FETCH-FILE', 
                    data:{
                        data: msg,
                        cmd: 'REPT'
                    }
                })
            },
            chooseShow (names) {
                let showNames = true
                if (names === 'spy') {
                    showNames = false
                } else if (this.tableName === 'alarm_mange' && names === 'id') {
                    showNames = false
                } else if (this.tableName === 'alarm_mange' && names === 'event_id') {
                    showNames = false
                }
                return showNames
            },
            checkSpell (text) {
                let msg = {
                    value: 'notsave',
                    tip: `${text}`
                }
                window.xdata.commit('metaStore/saveHintip', msg)
            },
            chooseInput (evt) {
                let target = evt.target
                let key = target.parentElement.parentElement.getAttribute('keyName')
                let row = this.rows[key]
                let eventID = row.id
                let checked = target.checked 
                let eventKey = this.tableName === 'alarm_mange' ? eventID + 'AND' + row.cur_time : `${row.staff_id}${row.shift_id}${new Date(row.duty_date).getTime()}`
                checked ? this.selectInputs.set(eventKey, {select: true, row: row}) : this.selectInputs.delete(eventKey)
                if (this.isSelectAll) {
                    this.checkAllStatus = !checked ? false : this.checkAllStatus
                    !checked ? this.notChecked.set(eventKey, {select: true, row: row}) : this.notChecked.delete(eventKey)
                    if (this.notChecked.size === 0) this.checkAllStatus = true
                    this.$store.commit('stateStore/changeAlarmCheckAllStatus', this.checkAllStatus)
                }
            },
            chooseAllOrNot (evt) {
                this.checkAllStatus = !this.checkAllStatus
                this.isSelectAll = this.checkAllStatus
                let self = this
                this.rows.forEach(item => {
                    let eventID = item.id
                    let eventKey = this.tableName === 'alarm_mange' ? eventID + 'AND' + item.cur_time : `${item.staff_id}${item.shift_id}${new Date(item.duty_date).getTime()}`
                    if (this.isSelectAll) {
                        if (self.notChecked.get(eventKey)) {
                            self.notChecked.delete(eventKey)
                            self.selectInputs.set(eventKey, {select: true, row: item})
                        } else {
                            self.selectInputs.set(eventKey, {select: true, row: item})
                        }
                    } else {
                        self.selectInputs.delete(eventKey)
                    }
                })
                this.$store.commit('stateStore/changeAlarmCheckAllStatus', this.checkAllStatus)
            },
            initChoose () {
                this.checkAllStatus = this.checkAllStatus
                // this.isSelectAll = this.checkAllStatus
                let self = this
                this.rows.forEach(item => {
                    let eventID = item.id
                    let eventKey = this.tableName === 'alarm_mange' ? eventID + 'AND' + item.cur_time : `${item.staff_id}${item.shift_id}${new Date(item.duty_date).getTime()}`
                    // if (this.isSelectAll) {
                    //     if (self.notChecked.get(eventKey)) {
                    //         self.notChecked.delete(eventKey)
                    //         self.selectInputs.set(eventKey, {select: true, row: item})
                    //     } else {
                    //         self.selectInputs.set(eventKey, {select: true, row: item})
                    //     }
                    // } else {
                    //     self.selectInputs.delete(eventKey)
                    // }
                    if (self.isSelectAll) {
                        self.notChecked.get(eventKey) ? self.selectInputs.delete(eventKey) : self.selectInputs.set(eventKey, {select: true, row: item})
                    } else {
                        self.selectInputs.delete(eventKey)
                    }
                })
            },
            searchListShow () {
                let isShow = false
                if (this.def && this.tableName !== 'number_bars') {
                    isShow = true
                    if (this.tableName === 'his_leader_arrange_2' && window.xdata.roleID !== 1) {
                        isShow = false
                    }
                }
                return isShow
            },
            chooseSelect(row) {
                let isChoose = false
                let key = this.tableName === 'alarm_mange' ? row.id+'AND'+row.cur_time : `${row.staff_id}${row.shift_id}${new Date(row.duty_date).getTime()}`
                if (this.selectInputs.get(key)) isChoose = true
                return isChoose
            }
        },
        watch: {
            'tableData': {
                immediate:true,
                handler: function (result) {
                    this.init(result) 
                },
                deep: true
            },
            '$store.state.stateStore.checkStatus': {
                handler: function (result) {
                    this.checkAllStatus = result
                    this.checkAllSql()
                }
            },
            '$store.state.metaStore.metaUpdateDBres': {
                handler: function (result) {
                    if(result.data.name === 'alarm_mange' || result.data.name === 'his_leader_arrange_2'){
                        this.selectInputs = new Map()
                        this.notChecked =new Map()
                        this.isSelectAll =false
                        this.checkAllStatus = this.checked
                    }
                },
                deep: true
            },
        },
        components: {
            blankMessage,
            searchList
        }
    }
</script>
<style lang="sass" scoped>
    .control
        display: flex
        cursor: pointer
        flex: 0 0 1.5rem
        justify-content: flex-end
        padding: 0 1rem
        span
            margin: .5rem .5rem
            cursor: pointer
            &:hover
                color: #09f
            .pointImg
                width: 1.25rem
                height: 1.25rem
    .content-panel
        flex: auto
        padding: 10px
        color: #666
        display: flex
        flex-flow: inherit
        padding: 1rem
        height: 100%
        overflow: auto
        table
            margin: 0
            width: 100%
            text-align: center
            border-collapse: collapse
            font-size: 0.8rem
            display: table
            border-spacing: 2px
            border-color: grey
            thead tr
                height: 3.4rem
                color: #3f3f3f
                border-bottom: 1px solid #ccc
                th
                    padding: 0 2px
                    &:nth-child(1)
                        padding-left: 14px
                    &:nth-last-child(1)
                        padding-right: 14px
                    .checkbox
                        width: 1rem
                        height: 1rem
                        padding: 0 .2rem
                        border-radius: 2px
                        background: none
                        border: 0
                        border-bottom: 1px solid #c0c2c3
                        vertical-align: middle
                    .icon
                        fill: #666666
                        vertical-align: bottom
                    .show-label
                        cursor: pointer
                    .check
                        cursor: pointer
            tbody
                background: #fff
                tr 
                    height: 2.8rem
                    color: #3f3f3f
                    border-bottom: 1px solid #dedede
                    opacity: 0.8
                    cursor: pointer
                    td
                        padding: 0 2px
                        &:nth-child(1)
                            padding-left: 14px
                        &:nth-last-child(1)
                            padding-right: 14px
                        .black-icon
                            fill: #3f3f3f
                            fill-opacity: 0.8
                            width: 1rem
                            height: 1rem
                            display: inline-block
                            cursor: pointer
                        .checkbox
                            width: 1rem
                            height: 1rem
                            padding: 0 .2rem
                            border-radius: 2px
                            background: none
                            border: 0
                            border-bottom: 1px solid #c0c2c3
                            vertical-align: middle
    .blank-message
        color: #999
        flex: auto
        display: -webkit-box
        display: -ms-flexbox
        display: flex
        justify-content: center
        align-items: center
        flex-flow: column nowrap
        padding: 2rem
</style>
