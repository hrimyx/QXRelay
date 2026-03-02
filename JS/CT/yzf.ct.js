/**
 * 翼支付.签到 
 * APP 翼支付 左上角分省频道 签到有礼+每七日一宝箱(签到积分兑权益金 宝箱开权益金)活动截止到23.12.31
 * 
 * @fan 2023.4.30
 * https://github.com/hrimyr/QXRelay/blob/master/JS/CT/yzf.ct.js
 * 
 * 
 * MITM = yzfhb.ah163.net
 * ^https:\/\/yzfhb\.ah163\.net\/yzfSign2023\/(yzfsignmessage\/generateCheckCode|yzfyearsign\/sign) url script-request-header https://raw.githubusercontent.com/hrimyr/QXRelay/master/JS/CT/yzf.ct.js
 *
 * 5 0 * * * https://raw.githubusercontent.com/hrimyr/QXRelay/master/JS/CT/yzf.ct.js, tag=翼支付.签到, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Alpha/10000.png, enabled=true
 * 
 */




const taskName = '翼支付.签到'
const key = 'FAN_yzf'

const isRequest = typeof $request != "undefined"

//连签宝箱
var numDayBox = 0

!(async function () {
    if (isRequest) {
        const msg = getToken()
        $notify(taskName, '', msg)
        $done({})
    } else {
        const msg = await sign()
        const boxmsg = await openbox()
        $notify(taskName, '', msg + boxmsg)
        $done()
    }
})()

function getToken() {
    const cookieValue = $request.headers['Cookie']

    if (cookieValue != null) {

        const map = { 'cookie': cookieValue }
        const str = JSON.stringify(map)
        const svk = $prefs.setValueForKey(str, key)

        console.log(`🅵🅰🅽\n${taskName} cookie: ${cookieValue}`)
        return svk ? 'cookie写入成功' : 'cookie写入失败'
    } else {
        console.log(`🅵🅰🅽\n${taskName} cookie: ${cookieValue}`)
        return 'cookie获取失败'
    }
}

function sign() {
    return new Promise((resolve) => {

        const str = $prefs.valueForKey(key)

        if (str == null) {
            resolve(`请先获取cookie`)
        }

        const map = JSON.parse(str)

        const cookieValue = map['cookie']

        const url = 'https://yzfhb.ah163.net/yzfSign2023/yzfyearsign/sign'

        const req = {
            url: url,
            method: 'GET',
            headers: {
                'Cookie': cookieValue,
            },
            body: ''
        }

        $task.fetch(req).then(response => {
            console.log(`🅵🅰🅽\n${taskName} ${url} 请求成功: ${response.body}`)

            if (response.statusCode == 200) {
                const body = JSON.parse(response.body)

                if (body.code == 200) {
                    numDayBox = body.lxxb + 1
                    resolve(`${body.msg}`)
                }
                resolve(`签到失败: ${body.msg}`)
            }
            resolve(`签到失败: ${response.statusCode}`)

        }, reason => {
            console.log(`🅵🅰🅽\n${taskName} ${url} 请求失败: ${reason.error}`)
            resolve(`请求失败: ${reason.error}`)
        })

    })
}


function openbox() {
    return new Promise((resolve) => {

        if (numDayBox < 7) resolve(`连签${numDayBox}日`)

        const str = $prefs.valueForKey(key)

        if (str == null) {
            resolve(`请先获取cookie`)
        }

        const map = JSON.parse(str)

        const cookieValue = map['cookie']

        const url = 'https://yzfhb.ah163.net/yzfSign2023/yzfyearsign/receiveLxBx'

        const req = {
            url: url,
            method: 'GET',
            headers: {
                'Cookie': cookieValue,
            },
            body: ''
        }

        $task.fetch(req).then(response => {
            console.log(`🅵🅰🅽\n${taskName} ${url} 请求成功: ${response.body}`)

            if (response.statusCode == 200) {
                const body = JSON.parse(response.body)

                if (body.code == 200) {
                    resolve(`${body.msg}`)
                }
                resolve(`开宝箱失败: ${body.msg}`)
            }
            resolve(`开宝箱失败: ${response.statusCode}`)

        }, reason => {
            console.log(`🅵🅰🅽\n${taskName} ${url} 请求失败: ${reason.error}`)
            resolve(`开宝箱请求失败: ${reason.error}`)
        })

    })
}
