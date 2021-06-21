let reptQuery = {
  'virtual_path': {
    name: 'virtual_path',
    label: '历史路径模板修改',
    sqlTmpl: `select {resultFields} from dat_virtual_path where 1=1 {exprString} order by virtual_path_id;`,
    fields: {
      names: ['virtual_path_id', 'name', 'type', 'obj_id', 'date_format(start_time, "%Y-%m-%d %H:%i:%s") as start_time', 'date_format(end_time, "%Y-%m-%d %H:%i:%s") as end_time', 'valid'], // 字段, md5用于更新地图
      types: ['NUMBER', 'STRING', 'NUMBER', 'NUMBER', 'DATETIME', 'DATETIME', 'SELECT'],
      labels: ['路径模板id', '路径模板名称', '类型', '人员名称', '开始时间', '结束时间', '是否有效']
    },
    exprFields: [
      { name: 'virtual_path_id', label: '路径模板名称', type: 'SELECT' }
    ],
    exprList: [
      { type: 'FIXED', label: '所有', value: '1=1' }
    ],
    needBreakdown: false,
    autoExec: true
  },
  'his_virtual_path': {
    name: 'his_virtual_path',
    label: '虚拟路径模板管理',
    sqlTmpl: `select {resultFields} from his_virtual_path where 1=1 {exprString} order by virtual_path_id;`,
    fields: {
      names: ['id', 'virtual_path_id', 'begin_pt', 'last_time', 'speed'], 
      types: ['NUMBER', 'SELECT', 'STRING', 'NUMBER', 'NUMBER' ], 
      labels: ['序号', '路径名称', '坐标', '持续时间', '速度']
    },
    exprFields: [
      { name: 'virtual_path_id', label: '路径名称', type: 'SELECT' }
    ],
    exprList: [
      { type: 'FIXED', label: '所有', value: '1=1' }
    ],
    needBreakdown: false,
    autoExec: true
  },
  'his_leader_arrange_1': {
    name: 'his_leader_arrange_1',
    label: '虚拟路径绑定',
    sqlTmpl: `select {resultFields} from his_leader_arrange where task_type=1 {exprString};`,
    fields: {
      names: ['staff_id', 'shift_id', 'date_format(duty_date, "%Y-%m-%d") as duty_date', 'virtual_path_id', 'date_format(begin_time, "%H:%i:%s") as begin_time', 'user_id'], // 字段, md5用于更新地图
      types: ['SELECT', 'NUMBER', 'DATE', 'NUMBER', 'DATETIME', 'STRING'], // 字段类型
      labels: ['员工', '班次', '代班日期', '路径模板名称', '开始时间', '用户ID']
    },
    exprFields: [
      { name: 'staff_id', label: '员工', type: 'SELECT' }
    ],
    exprList: [
      { type: 'FIXED', label: '所有', value: '1=1' }
    ],
    needBreakdown: false,
    autoExec: true
  },
  'his_leader_arrange_2': {
    name: 'his_leader_arrange_2',
    label: '历史路径绑定',
    sqlTmpl: `select {resultFields} from his_leader_arrange where task_type=2 {exprString};`,
    fields: {
      names: ['staff_id', 'shift_id', 'date_format(duty_date, "%Y-%m-%d") as duty_date', 'virtual_path_id', 'date_format(begin_time, "%H:%i:%s") as begin_time', 'user_id', '"" as check_state'], // 字段, md5用于更新地图
      types: ['SELECT', 'NUMBER', 'DATE', 'NUMBER', 'DATETIME', 'STRING', 'STRING'], // 字段类型
      labels: ['员工', '班次', '代班日期', '路径模板名称', '开始时间', '用户ID', '选择']
    },
    exprFields: [
      { name: 'staff_id', label: '员工', type: 'SELECT' }
    ],
    exprList: [
      { type: 'FIXED', label: '所有', value: '1=1' }
    ],
    needBreakdown: false,
    autoExec: true
  },
  'rpt_att_staff': {
    name: 'rpt_att_staff',
    label: '历史轨迹管理',
    sqlTmpl: `select {resultFields} from rpt_att_staff ras left join dat_staff ds on ds.staff_id = ras.staff_id where 1=1 {exprString} and TIMESTAMPDIFF(SECOND, start_time, end_time) >= 10 order by ras.start_time desc;`,
    fields: {
      names: ['ras.staff_id', 'ds.name', 'ras.card_id', 'DATE_FORMAT(ras.start_time, "%Y-%m-%d %H:%i:%s") as start_time', 'DATE_FORMAT(ras.end_time, "%Y-%m-%d %H:%i:%s") as end_time', 'ras.shift_id'], // 字段, md5用于更新地图
      types: ['NUMBER', 'STRING', 'NUMBER', 'DATETIME', 'DATETIME', 'SELECT'], // 字段类型
      labels: ['工号', '名称', '卡号', '考勤开始时间', '考勤结束时间', '班次']
    },
    exprFields: [
      { name: 'ras.staff_id', label: '员工', type: 'SELECT' },
      { name: 'ras.start_time', label: '开始时间', type: 'DATETIME', fieldname: 'start_time' },
      { name: 'ras.end_time', label: '结束时间', type: 'DATETIME', fieldname: 'end_time' }
    ],
    exprList: [
      { type: 'FIXED', label: '所有', value: '1=1' }
    ],
    needBreakdown: false,
    autoExec: true
  },
  // 'his_location_staff_': {
  //   name: 'his_location_staff_',
  //   label: '历史轨迹管理',
  //   sqlTmpl: `select {resultFields} from his_location_staff_ where 1=1 {exprString} order by begin_time desc;`,
  //   fields: {
  //     names: ['id', 'obj_id', 'card_type_id', 'ident', 'date_format(begin_time, "%Y-%m-%d %H:%i:%s") as begin_time', 'date_format(last_time, "%Y-%m-%d %H:%i:%s") as last_time', 'map_id', 'area_id', 'speed', 'begin_pt', 'direction'], // 字段, md5用于更新地图
  //     types: ['NUMBER', 'NUMBER', 'NUMBER', 'NUMBER', 'DATETIME', 'DATETIME', 'NUMBER', 'NUMBER', 'NUMBER', 'STRING', 'NUMBER'], // 字段类型
  //     labels: ['轨迹ID', '员工', '卡类别', '人员标识', '开始时间', '结束时间', '地图', '区域', '速度', '坐标', '方向']
  //   },
  //   exprFields: [
  //     { name: 'obj_id', label: '员工', type: 'SELECT' },
  //     { name: 'begin_time', label: '开始时间', type: 'DATETIME', fieldname: 'start_time' },
  //     { name: 'begin_time', label: '结束时间', type: 'DATETIME', fieldname: 'end_time' }
  //   ],
  //   exprList: [
  //     { type: 'FIXED', label: '所有', value: '1=1' }
  //   ],
  //   needBreakdown: false,
  //   autoExec: false
  // },
  'alarm_mange': {
    name: 'alarm_mange',
    label: '报警明细',
    sqlTmpl: `select {resultFields} from (select * from his_event_data where stat = 0) hed left join ( select id,event_id,cur_time from his_event_data where stat = 100) hed1 on (hed.id = hed1.id and hed.event_id = hed1.event_id) where 1=1 {exprString} order by hed.event_id desc;`,
    fields: {
      names: ['hed.event_id', 'hed.event_type_id', 'hed.obj_id', 'hed.area_id', 'date_format(hed.cur_time, "%Y-%m-%d %H:%i:%s") as start_time', 'ifnull(date_format(hed1.cur_time, "%Y-%m-%d %H:%i:%s"), "") as end_time', 'concat("+",hed.id) as id', '"" as check_state'],
      types: ['NUMBER', 'SELECT', 'SELECT', 'DATETIME', 'DATETIME', 'STRING', 'STRING'],
      labels: ['事件ID', '告警类型', '告警主体', '所属区域', '开始告警时间', '结束告警时间', '唯一ID标识', '选择']
    },
    exprFields: [
      { name: 'event_type_id', label: '报警类型', type: 'SELECT' },
      { name: 'date(hed.cur_time)', label: '开始时间', type: 'DATE', fieldname: 'start_time' },
      { name: 'date(hed.cur_time)', label: '结束时间', type: 'DATE', fieldname: 'end_time' }
    ],
    exprList: [
      { type: 'FIXED', label: '所有', value: '1=1' }
    ],
    needBreakdown: false,
    autoExec: false
  }
}

export default reptQuery