/**
 * https://55gy.cn/
 * https://55gy.cn/api/jxydt.js
 * 驾校一点通vip 10.9.1
 */ 


const url = $request.url;
const body = $response.body;
const path1 = "checkRights";
const path2 = "batchCheckRights";
const path3 = "checkRights?";
const path4 = "popRealExamProcess";
const path5 = "getUserRightsLabelSummary";
const path6 = "getPageInitInfo";
if (url.indexOf(path1) != -1) {
  var obj = JSON.parse(body);
  obj= {
    "result" : {
      "status" : "2",
      "beginTime" : "2022-06-29",
      "endTime" : "2099-07-01",
      "userBindDeviceList" : [
  
      ],
      "level" : 1,
      "overdueSecond" : "0",
      "deviceOverflow" : "0",
      "resourceId" : null,
      "rightsType" : "SPEED_VIP_KM4",
      "residualSecond" : "2428272000",
      "description" : null
    },
    "msg" : "ok",
    "code" : 0
  };
  $done({body: JSON.stringify(obj)});
}
if (url.indexOf(path2) != -1) {
  var obj = JSON.parse(body);
  obj= {
    "result" : {
      "SPEED_VIP_KM2" : {
        "status" : "2",
        "beginTime" : "2022-06-29",
        "endTime" : "2099-07-01",
        "userBindDeviceList" : [
  
        ],
        "level" : 1,
        "overdueSecond" : "0",
        "deviceOverflow" : "0",
        "resourceId" : "",
        "rightsType" : "SPEED_VIP_KM2",
        "residualSecond" : "2428272000",
        "description" : null
      },
      "RELIABLE_VIP_KM4" : {
        "status" : "2",
        "beginTime" : "2022-06-29",
        "endTime" : "2099-07-01",
        "userBindDeviceList" : [
  
        ],
        "level" : 1,
        "overdueSecond" : "0",
        "deviceOverflow" : "0",
        "resourceId" : "",
        "rightsType" : "RELIABLE_VIP_KM4",
        "residualSecond" : "2428272000",
        "description" : null
      },
      "RELIABLE_VIP_KM1" : {
        "status" : "2",
        "beginTime" : "2022-06-29",
        "endTime" : "2099-07-01",
        "userBindDeviceList" : [
  
        ],
        "level" : 1,
        "overdueSecond" : "0",
        "deviceOverflow" : "0",
        "resourceId" : "",
        "rightsType" : "RELIABLE_VIP_KM1",
        "residualSecond" : "2428272000",
        "description" : null
      },
      "SPEED_VIP_KM3" : {
        "status" : "2",
        "beginTime" : "2022-06-29",
        "endTime" : "2099-07-01",
        "userBindDeviceList" : [
  
        ],
        "level" : 1,
        "overdueSecond" : "0",
        "deviceOverflow" : "0",
        "resourceId" : "",
        "rightsType" : "SPEED_VIP_KM3",
        "residualSecond" : "2428272000",
        "description" : null
      },
      "SPEED_VIP_KM4" : {
        "status" : "2",
        "beginTime" : "2022-06-29",
        "endTime" : "2099-07-01",
        "userBindDeviceList" : [
  
        ],
        "level" : 1,
        "overdueSecond" : "0",
        "deviceOverflow" : "0",
        "resourceId" : "",
        "rightsType" : "SPEED_VIP_KM4",
        "residualSecond" : "2428272000",
        "description" : null
      },
      "VIP" : {
        "status" : "2",
        "beginTime" : "2022-06-29",
        "endTime" : "2099-07-01",
        "userBindDeviceList" : [
  
        ],
        "level" : 1,
        "overdueSecond" : "0",
        "deviceOverflow" : "0",
        "resourceId" : "",
        "rightsType" : "VIP",
        "residualSecond" : "2428272000",
        "description" : ""
      },
      "SVIP" : {
        "status" : "2",
        "beginTime" : "2022-06-29",
        "endTime" : "2099-07-01",
        "userBindDeviceList" : [
  
        ],
        "level" : 1,
        "overdueSecond" : "0",
        "deviceOverflow" : "0",
        "resourceId" : "",
        "rightsType" : "SVIP",
        "residualSecond" : "2428272000",
        "description" : null
      },
      "SVIP_LIVECAMP" : {
        "status" : "5",
        "beginTime" : "2022-06-28",
        "endTime" : "2022-06-28",
        "userBindDeviceList" : [
  
        ],
        "level" : 0,
        "overdueSecond" : "0",
        "deviceOverflow" : "0",
        "resourceId" : "",
        "rightsType" : "SVIP_LIVECAMP",
        "residualSecond" : "0",
        "description" : null
      },
      "SPEED_VIP_KM1" : {
        "status" : "2",
        "beginTime" : "2022-06-29",
        "endTime" : "2099-07-01",
        "userBindDeviceList" : [
  
        ],
        "level" : 1,
        "overdueSecond" : "0",
        "deviceOverflow" : "0",
        "resourceId" : "",
        "rightsType" : "SPEED_VIP_KM1",
        "residualSecond" : "2428272000",
        "description" : null
      }
    },
    "msg" : "ok",
    "code" : 0
  };
  $done({body: JSON.stringify(obj)});
}
if (url.indexOf(path3) != -1) {
  var obj = JSON.parse(body);
  obj= {
    "msg" : "OK",
    "result" : {
      "rights" : [
        {
          "enable" : "0",
          "rightsNo" : "4"
        },
        {
          "enable" : "0",
          "rightsNo" : "14"
        }
      ]
    },
    "code" : 0
  };
  $done({body: JSON.stringify(obj)});
}
if (url.indexOf(path4) != -1) {
  var obj = JSON.parse(body);
  obj= {
    "result" : {
      "isShow" : "0",
      "title" : null,
      "deepLink" : "jxedt:\/\/native?data={\"pagetype\":\"oneYuanBuy\",\"extparam\":{\"android\":{\"kemuType\":\"\",\"source\":\"400068\",\"url\":\"https:\/\/muses.jxedt.com\/oneBuy\/index.html#\/?pageClass=planB&pageType=pageTypeB&subjectType=\"},\"ios\":{\"kemuType\":\"\",\"source\":400068,\"url\":\"https:\/\/muses.jxedt.com\/oneBuy\/index.html#\/?pageClass=planA&pageType=pageTypeA&subjectType=\"}}}"
    },
    "msg" : "ok",
    "code" : 0
  };
  $done({body: JSON.stringify(obj)});
}
if (url.indexOf(path5) != -1) {
  var obj = JSON.parse(body);
  obj= {
    "result" : {
      "userRightsLabelSummary" : "500113,200113,201113,300113,301113,302113,400113,401113,100113,101113,102113"
    },
    "msg" : "ok",
    "code" : 0
  };
  $done({body: JSON.stringify(obj)});
}
if (url.indexOf(path6) != -1) {
  var obj = JSON.parse(body);
  obj= {
    "result" : {
      "limitRightsInitVO" : [
        {
          "subjectTitle" : "绉戜竴灏婁韩VIP",
          "triangleSign" : "https:\/\/t2.58cdn.com.cn\/brandads\/jxedt\/back\/n_v25a7915bcb88e45b0bee7ed3ca53ad47b_5fa0e6d8c7de0fe0.png",
          "subTitle" : "绉戜竴灏婁韩",
          "backGroundCard" : "https:\/\/t2.58cdn.com.cn\/brandads\/jxedt\/back\/n_v251598d265d9a4170873a1ca596fde9bc_c2d87f284a01dc1c.png",
          "backGround" : "https:\/\/t1.58cdn.com.cn\/brandads\/jxedt\/back\/n_v2f0b5ee41972a43eeaa7f40e37d019239_65044edb5d507549.png",
          "statusPic" : "https:\/\/t2.58cdn.com.cn\/brandads\/jxedt\/back\/n_v272707fcf48e44a8b8c794e0836860e1a_e86576aa9eeda1ee.png",
          "title" : "鍏ㄧ鐩秴绾IP",
          "icon" : "https:\/\/t1.58cdn.com.cn\/brandads\/jxedt\/back\/n_v2ae9dc5c03e0f45588ada476cb4f249c2_8670b358fda25f93.png",
          "endTime" : "2099-07-01鍒版湡",
          "rightsType" : "SVIP",
          "examPass" : "鑰冭瘯棰勬祴閫氳繃鐜�1000%",
          "status" : "2"
        },
        {
          "status" : "2",
          "backGroundCard" : "https:\/\/t2.58cdn.com.cn\/brandads\/jxedt\/back\/n_v251598d265d9a4170873a1ca596fde9bc_c2d87f284a01dc1c.png",
          "subjectTitle" : "绉戜簩涓撻」VIP",
          "statusPic" : "https:\/\/t2.58cdn.com.cn\/brandads\/jxedt\/back\/n_v272707fcf48e44a8b8c794e0836860e1a_e86576aa9eeda1ee.png",
          "endTime" : "2099-07-01鍒版湡",
          "backGround" : "https:\/\/t1.58cdn.com.cn\/brandads\/jxedt\/back\/n_v2f0b5ee41972a43eeaa7f40e37d019239_65044edb5d507549.png",
          "title" : "鍏ㄧ鐩秴绾IP",
          "triangleSign" : "https:\/\/t2.58cdn.com.cn\/brandads\/jxedt\/back\/n_v25a7915bcb88e45b0bee7ed3ca53ad47b_5fa0e6d8c7de0fe0.png",
          "rightsType" : "SVIP",
          "examPass" : "鑰冭瘯棰勬祴閫氳繃鐜�1000%",
          "icon" : "https:\/\/t1.58cdn.com.cn\/brandads\/jxedt\/back\/n_v2ae9dc5c03e0f45588ada476cb4f249c2_8670b358fda25f93.png",
          "subTitle" : "绉戜簩涓撻」"
        },
        {
          "status" : "2",
          "backGroundCard" : "https:\/\/t2.58cdn.com.cn\/brandads\/jxedt\/back\/n_v251598d265d9a4170873a1ca596fde9bc_c2d87f284a01dc1c.png",
          "subjectTitle" : "绉戜笁涓撻」VIP",
          "statusPic" : "https:\/\/t2.58cdn.com.cn\/brandads\/jxedt\/back\/n_v272707fcf48e44a8b8c794e0836860e1a_e86576aa9eeda1ee.png",
          "endTime" : "2099-07-01鍒版湡",
          "backGround" : "https:\/\/t1.58cdn.com.cn\/brandads\/jxedt\/back\/n_v2f0b5ee41972a43eeaa7f40e37d019239_65044edb5d507549.png",
          "title" : "鍏ㄧ鐩秴绾IP",
          "triangleSign" : "https:\/\/t2.58cdn.com.cn\/brandads\/jxedt\/back\/n_v25a7915bcb88e45b0bee7ed3ca53ad47b_5fa0e6d8c7de0fe0.png",
          "rightsType" : "SVIP",
          "examPass" : "鑰冭瘯棰勬祴閫氳繃鐜�1000%",
          "icon" : "https:\/\/t1.58cdn.com.cn\/brandads\/jxedt\/back\/n_v2ae9dc5c03e0f45588ada476cb4f249c2_8670b358fda25f93.png",
          "subTitle" : "绉戜笁涓撻」"
        },
        {
          "subjectTitle" : "绉戝洓灏婁韩VIP",
          "triangleSign" : "https:\/\/t2.58cdn.com.cn\/brandads\/jxedt\/back\/n_v25a7915bcb88e45b0bee7ed3ca53ad47b_5fa0e6d8c7de0fe0.png",
          "subTitle" : "绉戝洓灏婁韩",
          "backGroundCard" : "https:\/\/t2.58cdn.com.cn\/brandads\/jxedt\/back\/n_v251598d265d9a4170873a1ca596fde9bc_c2d87f284a01dc1c.png",
          "backGround" : "https:\/\/t1.58cdn.com.cn\/brandads\/jxedt\/back\/n_v2f0b5ee41972a43eeaa7f40e37d019239_65044edb5d507549.png",
          "statusPic" : "https:\/\/t2.58cdn.com.cn\/brandads\/jxedt\/back\/n_v272707fcf48e44a8b8c794e0836860e1a_e86576aa9eeda1ee.png",
          "title" : "鍏ㄧ鐩秴绾IP",
          "icon" : "https:\/\/t1.58cdn.com.cn\/brandads\/jxedt\/back\/n_v2ae9dc5c03e0f45588ada476cb4f249c2_8670b358fda25f93.png",
          "endTime" : "2099-07-01鍒版湡",
          "rightsType" : "SVIP",
          "examPass" : "鑰冭瘯棰勬祴閫氳繃鐜�1000%",
          "status" : "2"
        }
      ]
    },
    "msg" : "ok",
    "code" : 0
  };
  $done({body: JSON.stringify(obj)});
}