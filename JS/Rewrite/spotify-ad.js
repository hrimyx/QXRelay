// QX 兼容版：Spotify 去广告三合一（搜索页 / 首页 / 滚动页）
// 合并自 spot-NoSearchAd.js、spot-NoHomeAd.js、spot-NoScrollAd.js。
// 三个脚本逻辑相同（扫描前 666 字节，找到广告 tag 改写掉），仅特征字节不同；
// 合并后由一条重写规则匹配三个接口，脚本内按 $request.url 分发，保持原行为不变。
//
// QX 兼容说明：原版按 Surge binary-body-mode 编写，把 $response.body 当字节数组用；
// QX 的 $response.body 是字符串（二进制走字符串会丢数据），二进制必须走
// $response.bodyBytes(ArrayBuffer)。下面垫片让脚本在 QX 和 Surge 下都能跑。

let body, _useBytes = false;
if ($response.bodyBytes) {
  body = new Uint8Array($response.bodyBytes);
  _useBytes = true;
} else {
  body = $response.body; // Surge binary-body-mode：body 本身就是字节数组
}
function _doneBody(b) {
  if (_useBytes) $done({ bodyBytes: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) });
  else $done({ body: b });
}

const MAX = 666;

// 首页(AA 01) / 滚动页(F2 01)：tag 改为 F7 07
function patchTag(first) {
  for (let i = 0; i < MAX; i++) {
    if (body[i] === first && body[i + 1] === 0x01) {
      body[i] = 0xF7;
      body[i + 1] = 0x07;
      console.log(`去广告：偏移量 ${i} 处 tag 改写`);
      return true;
    }
  }
  return false;
}

function readVarint(buffer, offset) {
  let result = 0, shift = 0, pos = offset;
  while (true) {
    const byte = buffer[pos];
    result |= (byte & 0x7F) << shift; // 取低7位拼接
    pos++;
    if ((byte & 0x80) === 0) break; // 最高位为0 → 结束
    shift += 7;
  }
  return { value: result, length: pos - offset };
}

// 搜索页：field 6 (tag 0x32)，数据长度 > 12000 则 tag 改为 0x7A
function patchField6() {
  for (let i = 0; i < MAX; i++) {
    if (body[i] === 0x32) { // 找到 field 6
      const { value, length } = readVarint(body, i + 1);
      if (value > 12000) {
        body[i] = 0x7A;
        console.log(`去广告：搜索页 field 6，位置 ${i}，长度 ${value}`);
        return true;
      }
    }
  }
  return false;
}

console.log(`SpotifyNoAd`);
const url = $request.url || '';
let changed = false;
if (/\/browsita\//.test(url)) changed = patchField6();
else if (/\/casita\/v\.\/home\//.test(url)) changed = patchTag(0xAA);
else if (/\/scrollsita\//.test(url)) changed = patchTag(0xF2);

if (changed) _doneBody(body);
else { console.log(`未检测到广告`); $done({}); }
