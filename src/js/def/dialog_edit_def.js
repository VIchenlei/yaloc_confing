let edit_def = {
  'virtual_path': {
    rows: '',
    def: {
      label: '历史路径模板修改',
      name: 'virtual_path',
      keyIndex: 0,
      table: 'dat_virtual_path',
      fields: {
        names: ['virtual_path_id', 'name', 'obj_id', 'start_time', 'end_time', 'valid'], // 字段, md5用于更新地图
        types: ['NUMBER', 'STRING', 'SELECT', 'DATETIME', 'DATETIME', 'SELECT'], // 字段类型
        labels: ['路径模板id', '路径模板名称', '人员名称', '开始时间', '结束时间', '是否有效'],
        enableNull: [false, false, false, true, true, true, true],
        enableEdit: [false, true, true, true, true, true, true]
      }
    }
  },
  'his_virtual_path': {
    rows: '',
    def: {
      label: '虚拟路径模板管理',
      name: 'his_virtual_path',
      keyIndex: 0,
      table: 'his_virtual_path',
      fields: {
        names: ['id', 'virtual_path_id', 'begin_pt', 'last_time', 'speed'], 
        types: ['NUMBER', 'SELECT', 'STRING', 'NUMBER', 'NUMBER' ], 
        labels: ['序号', '路径名称', '坐标', '持续时间', '速度'],
        enableNull: [false, false, false, false, false],
        enableEdit: [false, true, true, true, true, true]
      }
    }
  },
  'his_leader_arrange_1': {
    rows: '',
    def: {
      label: '虚拟路径绑定',
      name: 'his_leader_arrange_1',
      keyIndex: 0,
      table: 'his_leader_arrange',
      fields: {
        names: ['staff_id', 'shift_id', 'duty_date', 'virtual_path_id', 'begin_time'], 
        types: ['SELECT', 'SELECT', 'DATE', 'SELECT', 'TIME'], 
        labels: ['员工', '班次', '代班日期', '路径模板名称', '开始时间'],
        enableNull: [false, false, false, false, false],
        enableEdit: [false, true, true, true, true]
      }
    }
  },
  'his_leader_arrange_2': {
    rows: '',
    def: {
      label: '历史路径绑定',
      name: 'his_leader_arrange_2',
      keyIndex: 0,
      table: 'his_leader_arrange',
      fields: {
        names: ['staff_id', 'shift_id', 'duty_date', 'virtual_path_id', 'begin_time'], 
        types: ['SELECT', 'SELECT', 'DATE', 'SELECT', 'TIME'], 
        labels: ['员工', '班次', '代班日期', '路径模板名称', '开始时间'],
        enableNull: [false, false, false, false, false],
        enableEdit: [false, true, true, true, true]
      }
    }
  },
  'rpt_att_staff': {
    rows: '',
    def: {
      label: '历史轨迹删除',
      name: 'rpt_att_staff',
      keyIndex: 0,
      table: 'rpt_att_staff',
      fields: {
        names: ['staff_id', 'name', 'card_id', 'start_time', 'end_time'], // 字段, md5用于更新地图
        types: ['NUMBER', 'STRING', 'NUMBER', 'DATETIME', 'DATETIME'], // 字段类型
        labels: ['工号', '名称', '卡号', '考勤开始时间', '考勤结束时间'],
        enableNull: [false, false, false, false, false],
        enableEdit: [false, true, true, true, true]
      }
    }
  },
  'rpt_att_staff_all': {
    rows: '',
    def: {
      label: '强制删除',
      name: 'rpt_att_staff',
      keyIndex: 0,
      table: 'rpt_att_staff_all',
      fields: {
        names: ['staff_id', 'start_time', 'end_time'], // 字段, md5用于更新地图
        types: ['SELECT', 'DATETIME', 'DATETIME'], // 字段类型
        labels: ['工号', '考勤开始时间', '考勤结束时间'],
        enableNull: [false, false, false],
        enableEdit: [true, true, true]
      }
    }
  },
  'his_location_staff_': {
    rows: '',
    def: {
      label: '历史轨迹管理',
      name: 'his_location_staff_',
      keyIndex: 0,
      table: 'his_location_staff_',
      fields: {
        names: ['obj_id', 'card_type_id', 'ident', 'begin_time', 'last_time', 'map_id', 'area_id', 'speed', 'begin_pt', 'direction'], // 字段, md5用于更新地图
        types: ['SELECT', 'SELECT', 'NUMBER', 'DATETIME', 'DATETIME', 'SELECT', 'SELECT', 'NUMBER', 'STRING', 'NUMBER'], // 字段类型
        labels: ['人员', '卡类型', '人员标识', '开始时间', '结束时间', '地图', '区域', '速度', '坐标', '方向'],
        enableNull: [false, false, false, false, true, false, false, false, true, false],
        enableEdit: [false, true, true, true, true, true, true, true, true, true]
      }
    }
  },
  'user': {
    rows: '',
    def: {
      label: '定位系统账户管理',
      name: 'user',
      keyIndex: 0,
      table: 'dat_user',
      fields: {
        names: ['user_id', 'name', 'role_id', 'obj_range', 'is_check'], // 字段
        types: ['STRING', 'STRING', 'SELECT', 'SELECT', 'SELECT'], // 字段类型
        labels: ['账户名称', '用户名称', '用户角色', '管理范围', '用户类别'],
        enableNull: [false, false, false, true, true],
        enableEdit: [false, false, false, true, true]
      }
    }
  },
  'user_tool': {
    rows: '',
    def: {
      label: '工具系统账户管理',
      name: 'user_tool',
      keyIndex: 0,
      table: 'dat_user_tool',
      fields: {
        names: ['user_tool_id', 'name', 'role_id'], // 字段
        types: ['STRING', 'STRING', 'SELECT'], // 字段类型
        labels: ['账户名称', '用户名称', '用户角色'],
        enableNull: [false, false, false],
        enableEdit: [false, true, true]
      }
    }
  },
  'area': {
    rows: '',
    def: {
      label: '区域上报管理',
      name: 'area',
      keyIndex: 0,
      table: 'dat_area',
      fields: {
        names: ['area_id', 'name', 'area_type_id', 'area_type_rp_id', 'over_count_person_rp'], // 字段
        types: ['NUMBER', 'STRING', 'SELECT', 'SELECT', 'NUMBER'], // 字段类型
        labels: ['区域编号', '区域名称', '区域类型', '上报区域类型', '核定人数'],
        enableNull: [false, false, false, true, true],
        enableEdit: [false, false, false, true, true]
      }
    }
  },
  'staff_extend': {
    rows: '',
    def: {
      label: '人员业务表',
      name: 'staff_extend',
      keyIndex: 0,
      table: 'dat_staff_extend',
      fields: {
        names: ['staff_id', 'dept_id', 'card_id', 'lampNo', 'min_work_time', 'need_display', 'work_line'], // 字段
        types: ['SELECT', 'SELECT', 'NUMBER', 'STRING', 'NUMBER', 'SELECT', 'SELECT'], // 字段类型
        labels: ['员工', '部门', '卡号', '矿灯号', '最小下井时长', '是否显示', '几线工人'],
        enableNull: [false, true, false, true, false, true, true],
        enableEdit: [false, false, false, false, true, true, true]
      }
    }
  },
  'vehicle_extend': {
    rows: '',
    def: {
      label: '车辆业务表',
      name: 'vehicle_extend',
      keyIndex: 0,
      table: 'dat_vehicle_extend',
      fields: {
        names: ['vehicle_id', 'dept_id', 'group_id', 'card_id', 'need_display'],
        types: ['SELECT', 'SELECT', 'SELECT', 'NUMBER', 'SELECT'],
        labels: ['车辆编号', '部门', '班组', '卡号', '是否显示'],
        enableNull: [false, true, false, false, true],
        enableEdit: [false, false, false, false, true]
      }
    }
  },
  'number_bars': {
    rows: '',
    def: {
      name: 'number_bars',
      label: '数据条数',
      table: 'number_bars',
      keyIndex: 0,
      fields: {
        names: ['id', 'dataNumber'],
        types: ['NUMBER', 'NUMBER'],
        labels: ['编号', '数据条数'],
        enableNull: [false, false],
        enableEdit: [false, true]
      }
    }
  },
  'alarm_mange': {
    rows: '',
    def: {
      label: '报警明细',
      name: 'alarm_mange',
      keyIndex: 0,
      table: 'his_event_data',
      fields: {
        names: ['event_id', 'event_type_id', 'obj_id', 'credentials_id', 'area_id', 'start_time', 'end_time'],
        types: ['NUMBER', 'SELECT', 'SELECT', 'SELECT', 'SELECT', 'DATETIME', 'DATETIME'],
        labels: ['事件ID', '告警类型', '告警主体', '资格证类型', '所属区域', '开始告警时间', '结束告警时间'],
        enableNull: [true, false, false, false, false, false, true],
        enableEdit: [true, false, true, true, true, true, true]
      }
    }
  },
  'virtual_path_his': {
    rows: '',
    def: {
      label: '历史路径模板添加',
      name: 'virtual_path',
      keyIndex: 0,
      table: 'dat_virtual_path',
      fields: {
        names: ['virtual_path_id', 'name', 'obj_id', 'start_time', 'end_time', 'valid'], // 字段, md5用于更新地图
        types: ['NUMBER', 'STRING', 'SELECT', 'DATETIME', 'DATETIME', 'SELECT'], // 字段类型
        labels: ['路径模板id', '路径模板名称','人员编号', '开始时间', '结束时间', '是否有效'],
        enableNull: [false, false, true, true, true, true],
        enableEdit: [true, true, true, true, true, true]
      }
    }
  }
}

let insert_def = {
  'his_leader_arrange_1': {
    rows: '',
    def: {
      label: '虚拟路径绑定',
      name: 'his_leader_arrange_1',
      keyIndex: 0,
      table: 'his_leader_arrange',
      fields: {
        names: ['virtual_path_id', 'begin_time'], 
        types: ['SELECT','DATETIME'], 
        labels: ['路径模板名称', '开始时间'],
        enableNull: [false, false],
      }
    }
  },
  'his_leader_arrange_2': {
    rows: '',
    def: {
      label: '历史路径绑定',
      name: 'his_leader_arrange_2',
      keyIndex: 0,
      table: 'his_leader_arrange',
      fields: {
        names: ['virtual_path_id', 'begin_time'], 
        types: ['SELECT','DATETIME'], 
        labels: ['路径模板名称', '开始时间'],
        enableNull: [false, false],
      }
    }
  },
}

export {edit_def,insert_def}
