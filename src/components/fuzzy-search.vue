<template>
    <div class="identify-staff">
        <div class="search-icon" id="selecticon" @click="doSearch">
        </div> 
        <input id="searchinput" ref="searchinput" type="search" class="search-box" size="10" :placeholder="typeDef && typeDef.placeholder" @blur="onblur" @input="getInputVal" @keyup="checkInput" @focus="focusInput" :disabled="disabled">
        <div v-if="isShowResultList" class="popup-list">
            <span v-if="hasresult" class="list-item" v-for="(item, index) in result" :key="index" @click="chooseItem" :data-type=" name === 'dept_ck' ? item['dept_id'] : item[name + '_id']" :data-index="index">{{item[dataSet.desc]}}</span>
            <span v-if="!hasresult && nohasresult"  class="tips"> 无符合条件的{{ typeDef.label }} </span>
        </div>
    </div>
</template>
<script>
import Fuse from 'fuse.js'
import { unique , clone } from '../js/utils/utils.js'
import { getNameByID } from '@/js/utils/metaStoreDep.js'
const MAX_ITEM_COUNT = 50
export default {
    props:['opts','oldvalue', 'disabled', 'isInit', 'morechoose'],
    data () {
        return {
            typeDef: this.opts.typeDef,
            dataSet: this.opts.dataSet,
            oldValue: this.oldvalue,
            name: null,
            isShowResultList: false,
            fuse: null,
            result: null,
            dealResult: null,
            backResult: null,
            hasresult: false,
            nohasresult: false,
            value: null
        }
    },
    mounted () {
        let opts = {
            threshold: 0,
            minMatchCharLength: 2,
            location: 0,
            tokenize: true,
            matchAllTokens: true,
            keys: this.dataSet && this.dataSet.keys
        }
        this.fuse = new Fuse(null, opts)

        this.updateData()
        // this.updateSearchDataSet(this.dataSet)
    },
    methods: {
        // 更新数据
        updateData (msg) {
            this.typeDef = msg && msg.typeDef ? msg.typeDef : this.typeDef
            this.dataSet = msg && msg.dataSet ? msg.dataSet : this.dataSet
            this.name = this.typeDef && this.typeDef.name
            let fuseList = this.dataSet && this.dataSet.data ? this.dataSet.data : Array.from(xdata.state.metaStore.data['staff'].values())
            let keyName = this.dataSet.keys[0]
            let oldValue = ''
            if (this.oldValue || this.oldValue === 0) {
                oldValue = keyName === 'card_id' ? this.oldValue : Number(this.oldValue)
            }
            
            let inputOldValue = fuseList.filter(item => item[keyName] === oldValue)[0]
            this.$el.querySelector('#searchinput').value = inputOldValue ? (this.dataSet.desc==='name' ? inputOldValue.name : inputOldValue[this.dataSet.desc]) : ''
            this.$refs['searchinput'].setAttribute('data-type', oldValue)
            this.updateSearchDataSet(this.dataSet)
        },

        // 检查input输入
        checkInput (evt) {
            let startSearch = false

            if (evt.keyCode === 13) {
                startSearch = true
            } else {
                let s = this.$refs['searchinput'].value
                if (s && s.length >= 1) {
                    if (!isNaN(parseInt(s, 10))) {
                        if (s.length >= 1) { // 数字需要至少三个字符
                        startSearch = true
                        }
                    } else { // 自动查找，字符只需要两个字符
                        startSearch = true
                    }
                } else {
                this.isShowResultList = false
                }
            }

            if (startSearch) {
                this.doSearch()
                
            }
            return true
        },

        // 更新数据函数
        updateSearchDataSet (dataSet) {
            this.fuse.list = dataSet && dataSet.data ? dataSet.data : Array.from(xdata.state.metaStore.data['staff'].values())
            this.fuse.options.keys = dataSet && dataSet.keys
        },

        // 查询函数
        doSearch () {
            this.dittoname=null
            let s = this.$refs['searchinput'].value
            if (!s) { // 少于两个字符不查询
                return
            }
            
            this.result = null
            this.dealResult = null
            this.backResult = null
            this.hasresult = false
            this.nohasresult = false
            let isSpell = (/^[A-Za-z]{1,}$/g).test(s)
            let matchs = isSpell ? this.getMatchs(s) : this.fuse.search(s)
            let dittoname=clone(matchs)
            if (matchs && matchs.length > 0) {
                matchs = matchs.slice(0, MAX_ITEM_COUNT)
                if(this.dataSet.desc==='name' && this.dataSet.hasOwnProperty('addpath')){                     
                    if(this.dataSet.hasOwnProperty('addpath') && this.dataSet.addpath){
                      dittoname.forEach(e => {
                          e.name = `${e.name} - ${getNameByID('dept_id',e.dept_id)}`
                      });      
                      this.result = dittoname
                    }else{
                      this.result = matchs
                    }
                    this.backResult = clone(this.result)
                }else if(this.dataSet.desc === 'name' && !this.dataSet.hasOwnProperty('addpath')){
                    if (this.dataSet.isSpecial) {
                        dittoname.forEach(e => {
                            e.name =  `${e.staff_id}-${e.name}-${getNameByID('dept_id', e.dept_id) || '无部门信息'}`
                        });      
                        this.result = dittoname
                        this.backResult = clone(this.result)
                    } else {
                        this.backResult = clone(matchs)
                        this.result = unique(matchs)
                    }
                    
                }else{
                  this.result = matchs
                }
                this.hasresult = true
                this.nohasresult = false
            }
            this.isShowResultList = true
            if(this.result === null) {
              this.nohasresult  = true
              this.hasresult  = false
            }
        },

        // 选中查询结果函数
        chooseItem (evt) {
            evt.stopPropagation()
            let t = evt.currentTarget
            let v = t.getAttribute('data-index')
            let i = v && parseInt(v, 10)
            let self = this
            let value = this.backResult[i].name && this.dataSet.desc==='name' ? this.result[i][this.dataSet.desc] : this.backResult[i].name 
            let resultArr=[]          
            for (let i = 0; i < this.backResult.length; i++) {
                if(this.backResult[i].name===value){
                    resultArr.push(this.backResult[i])
                }
            }
            this.dataSet.desc==='name' ? this.typeDef.cb(resultArr,this.dataSet) : this.typeDef.cb(self.result[i],this.dataSet)
            this.dealResult = this.dataSet.desc === 'name' ? resultArr : self.result[i]
            let desc = this.dataSet.desc
            if (!this.morechoose) {
                this.$el.querySelector('#searchinput').value = this.dataSet.desc==='name' ? resultArr[0].name : this.result[i].desc
            } else {
                this.clearSearchInput()
            }
            
            this.isShowResultList = false
            this.$refs['searchinput'].setAttribute('data-type', t.getAttribute('data-type'))
            evt.preventUpdate = true
        },

        // 清空查询input
        clearSearchInput () {
            if(this.$refs['searchinput']){
                this.$refs['searchinput'].value = ''
            }
        },

        // 更新查询数据
        updateList (fuzzy) {
            this.clearSearchInput()
            this.updateData(fuzzy)
        },

        // 输入框内容为空的时候 隐藏 popup-list
        getInputVal (evt){
            this.nohasresult = true
            this.value = evt.target.value
            let value=evt.target.value
            if(value===""){
              this.isShowResultList = false
            }
        },
        focusInput (){
            this.isShowResultList = this.name === 'event_type' ? true : false
            if (this.isShowResultList) this.initSearchList()
        },
        // 失去焦点 结果集为null，隐藏 popup-list
        onblur (){        
          this.nohasresult = false
          if(this.result === null){
            this.hasresult = false
            this.isShowResultList = false
          }
        },
        initSearchList () {
            this.hasresult = true
            let inputValue = this.$refs['searchinput'].value
            this.result = this.result && inputValue ? this.result : this.dataSet.data
            this.backResult = clone(this.result)
        },
        getMatchs (s) {
            let lists = this.fuse.list
            lists = lists.filter(item => item.spy.includes(s.toUpperCase()) || item.spy.includes(s))
            return lists
        }

    },
    watch: {
        'opts': {
            handler: function (result) {
                if(result.flag === 'searchList'){
                    this.updateList(result)
                    this.isShowResultList = false
                }
            },
            deep: true
        },
        'isInit': {
            handler: function (result) {
                this.clearSearchInput()
                this.isShowResultList = false
            },
        }
  }
}
</script>
<style lang="sass" scoped>
    .identify-staff 
        flex: 2
        border: 1px solid #cccccc
        // border-left: none
        width: 35%
        text-align: left
        height: 2.7rem
        line-height: 2.7rem
        color: #333
        position: relative
        #searchinput
            width: 100%
            height: 100%
            border: 0
            // border-bottom: none
            padding-left: .5rem
            .input_bottom
                display: none
        .popup-list
            position: absolute
            background: #f5f5f5
            box-shadow: 0px 1px 20px -7px #333
            left: 1%
            width: 69%
            height: auto
            z-index: 9999
            padding: .5rem
            overflow-y: scroll
            display: flex
            flex-flow: column nowrap
            z-index: 9999
            width: 100%
            max-height: 16rem
            min-width: 7rem
            overflow-y: scroll
            text-overflow: ellipsis
            white-space: nowrap
            span   
                justify-content: flex-start
                padding-left: 28%
                display: block
                text-align: left
            .list-item 
                padding-left: 1%
                border-bottom: 1px solid #fff
                flex: 0 0 2.2rem           
                display: flex           
                justify-content: start
                align-items: center
                cursor: pointer
                height: 2rem
                line-height: 2rem
                border-bottom: 1px solid #fff
                overflow-y:scroll
</style>
