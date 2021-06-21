let importFileDef = {
  staff_extend: {
    name: 'staff_extend',
    label: '人员信息显示',
    table: 'dat_staff_extend',
    keyIndex: 0, // table中key值在 field 中的位置
    fields: {
      names: ['staff_id', 'name', 'dept_id', 'need_display'], // 字段
      types: ['NUMBER', 'STRING', 'SELECT', 'SELECT'], // 字段类型
      labels: ['员工', '姓名', '部门', '是否显示']
    }
  },
  vehicle_extend: {
    name: 'vehicle_extend',
    label: '车辆信息管理',
    table: 'dat_vehicle_extend',
    keyIndex: 0, // table中key值在 field 中的位置
    fields: {
      names: ['vehicle_id', 'name', 'dept_id', 'need_display'], // 字段
      types: ['NUMBER', 'STRING', 'SELECT', 'SELECT'], // 字段类型
      labels: ['车辆编号', '车辆名称', '部门', '是否显示']
    }
  },
  // alarm_mange: {
  //   name: 'alarm_mange',
  //   label: '告警明细管理',
  //   table: 'his_event_data',
  //   keyIndex: 2, // table中key值在 field 中的位置
  //   fields: {
  //     names: ['event_type_id', 'obj_type_id', 'obj_id', 'area_id', 'limit_value', 'cur_value', 'stat', 'x', 'y', 'dis_type', 'cur_time'],
  //     types: ['SELECT', 'SELECT', 'NUMBER', 'SELECT', 'NUMBER', 'NUMBER', 'SELECT', 'NUMBER', 'NUMBER', 'SELECT', 'DATETIME'],
  //     labels: ['告警类型', '告警对象类型', '告警主体', '所属区域', '限制数值', '实际数值', '告警状态', '坐标x', '坐标y', '告警可见范围', '时间']
  //   }
  // }
  alarm_mange: {
    name: 'alarm_mange',
    label: '告警明细管理',
    table: 'his_event_data',
    keyIndex: 2, // table中key值在 field 中的位置
    fields: {
      names: ['event_type_id', 'obj_id', 'area_id', 'start_time', 'end_time'],
      types: ['SELECT', 'NUMBER', 'SELECT', 'DATETIME', 'DATETIME'],
      labels: ['告警类型', '告警主体', '所属区域/资格证类型', '开始告警时间', '结束告警时间']
    }
  }
}

export {importFileDef}
