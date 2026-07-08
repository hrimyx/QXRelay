# Quantumult X 示例配置文件 (Sample Quantumult Configuration)
#
# 以 ";" 或 "#" 或 "//" 开头的行为注释行，不会被程序执行。
#
# SS-URI 方案的详细说明请参考 https://shadowsocks.org/en/spec/SIP002-URI-Scheme.html
#
# Quantumult 使用 HTTP HEAD 方法向 server_check_url（节点测试网址）发送 HTTP 请求来测试代理节点的状态。
# 测试结果会得出两个延迟数据：第一个是到代理服务器的 TCP 握手延迟；第二个是 HTTP 延迟（即 Quantumult 成功收到 server_check_url 的 HTTP 响应与 Quantumult 开始发起 HTTP 请求之间的时间差）。
# 界面中的闪电图标表示 TCP fast open（TCP 快速打开）成功。
# 如果 [server_local] (本地节点) 或 [server_remote] (远程节点) 模块中的节点自带了 server_check_url 参数，那么会优先使用该节点专属的 URL 进行连通性测试，而不是使用 [general] (全局设置) 模块下的默认 server_check_url。
#
# Quantumult 使用 HTTP HEAD 方法对测试网址 server_check_url 进行网页响应性测试（测试结果为通过该节点访问此网页的 HTTP 延迟, 即 HTTP 响应时间与 HTTP 请求发起时间的差值），来确认节点的可用性。
# Quantumult 界面中的延迟测试方式均为网页响应性测试，显示的最终延迟均为通过对应节点访问测试网页的 HTTP 延迟。
# 由于 Trojan 协议为无响应校验协议，使得 HTTP 检测方式即使获得了 HTTP 响应，也不代表节点一定可用。
#
# dns_exclusion_list 包含了禁用占位 IP (Placeholder IP: 198.18.0.0/15) 映射机制的域名。
# 不在 dns_exclusion_list 列表中的域名会启用占位 IP 映射机制，并产生所谓的 "resolve-on-remote" (远端解析) 效果。
# dns_exclusion_list 中的域名在进行 DNS 查询时，可能会也可能不会遵循 [dns] 模块中的规则设置。
#
# 当在 Quantumult X 其它设置中关闭「Enhanced Compatibility」 (增强兼容性) 全局选项时，enhanced_compatibility_ssid_list (增强兼容性 SSID 列表) 将会生效。
#
# udp_whitelist 包含允许放行的目标 UDP 端口，如果留空则表示所有端口都在 udp_whitelist 白名单中。
# 目标端口不在 udp_whitelist 中的 UDP 数据包（通过 Quantumult 隧道接口时）将被丢弃，并回传 ICMP (port unreachable/端口不可达) 消息。
# 此设置与分流规则 (filter rules) 或策略 (policies) 无关，也与代理(节点)服务器端口无关。
#
# udp_drop_list 包含需要拦截的目标 UDP 端口。其机制类似于 udp_whitelist 丢弃 UDP 数据包，也会回传 ICMP (port unreachable/端口不可达) 消息，让客户端能快速失败或回退到 TCP 协议，而无需等待自身请求超时。
# 只有在 udp_whitelist 中被允许的 UDP 数据包才能被 udp_drop_list 进一步拦截。
# 此列表可以添加包含你想丢弃的一些特定协议端口，例如 STUN、QUIC 等。
#
# 发往 excluded_routes (排除路由 IP 段) 的网络流量将不会被 Quantumult 接管处理。修改此项后建议重启你的设备。
#
# 默认情况下 ("loopback")，当一个域名在 DNS 层面被拒绝 (rejected) 时，将会返回环回 IP (loopback IP) 的响应。你可以通过设置 dns_reject_domain_behavior 为 "no-error-no-answer" 或 "nxdomain" 或 "none" 来更改这种默认行为。
# 这会将拒绝行为更改为：响应 NOERROR NOANSWER、或响应 NXDOMAIN、或通过 "none" 完全禁用 DNS 层面的拒绝功能。
# 如果你将一个原本被拒绝的域名更改为不拒绝（无论是通过更改配置、分流规则还是策略），最多可能需要 10 秒钟才能生效 (因为 TTL 缓存为 10)。
#
# 资源解析器 (resource_parser_url) 的示例可以在此处找到：https://raw.githubusercontent.com/crossutility/Quantumult-X/master/resource-parser.js
#
# server_check_timeout (节点检测超时) 的值仅在小于或等于 5000 (毫秒) 时才会生效。
# 该数值将与检测过程的总时长（包括 DNS 查询、TCP 握手、TLS 握手以及应用层 HTTP 会话时长）进行比较，因此真实的总时长可能会明显长于单纯的 "TCP 握手" 加上 "HTTP 会话时长"。
#
# fallback_udp_policy 将应用于那些被分流规则匹配到，但其指向节点本身不支持 UDP relay (UDP 转发) 的流量。
# fallback_udp_policy 的值应该指定为任何一个已启用 UDP relay 的代理节点标签 (tag/name)。
# 它的默认值为 reject (拒绝)，如果你填写了任何不是有效节点标签的其他值，也会被忽略并强制回退使用 reject。

[general]
# 配置文件头像图标的 URL
;profile_img_url =http://www.example.com/example.png
# 资源解析器脚本的 URL，用于对外部订阅进行转换
;resource_parser_url =http://www.example.com/parser.js
# 测试设备网络是否通畅的 URL
;network_check_url =http://bing.com
# 测试节点连通性的默认 URL（通常使用能返回 HTTP 204 的网址）
;server_check_url =http://www.google.com/generate_204
# 节点连通性测试请求中的 User-Agent 标头
;server_check_user_agent = Agent/1.0
# 节点连通性测试的超时时间（毫秒）
;server_check_timeout = 5000
# 遇到不支持 UDP 转发的节点时的备用 UDP 策略
;fallback_udp_policy=reject
# 发起 DoH (DNS over HTTPS) 请求时的 User-Agent 标头
;doh_user_agent = Agent/1.0
# IP 地理位置检测的 API 接口及处理脚本 URL
;geo_location_checker = http://www.example.com/json/, https://www.example.com/script.js
# 根据不同网络环境自动切换运行模式（直连/全局代理等）
;running_mode_trigger = filter, filter, LINK_22E171:all_proxy, LINK_22E172:all_direct
# DNS 排除列表，不使用占位 IP 进行远端解析的域名
dns_exclusion_list = *.cmpassport.com, *.jegotrip.com.cn, *.icitymobile.mobi, id6.me
# 域名在 DNS 层面被拒绝时的响应行为
;dns_reject_domain_behavior = loopback
# 暂停接管工作的 Wi-Fi SSID 列表
;ssid_suspended_list = LINK_22E174, LINK_22E175
# 开启增强兼容模式的特定 Wi-Fi SSID 列表
;enhanced_compatibility_ssid_list = LINK_22E174, LINK_22E175
# 允许通过隧道的 UDP 端口白名单
;udp_whitelist = 53, 123, 1900, 80-443
# 主动丢弃的 UDP 端口黑名单，可用于屏蔽 QUIC (避免 YouTube 等平台默认使用 HTTP3/QUIC 绕过 TCP 代理)
;udp_drop_list = 1900, 80, STUN, QUIC
# QX 隧道不接管的 IP 路由段（直连局域网等）
;excluded_routes = 192.168.0.0/16, 172.16.0.0/12, 100.64.0.0/10, 10.0.0.0/8
# 开启针对 ICMP Ping 的自动回复
;icmp_auto_reply = true

#
# 为获得更好的性能，将始终默认获取并使用当前网络（系统）分配的 DNS 服务器进行解析（你可以通过设置 "no-system" 来禁用此系统默认特性，但前提是你必须至少添加一个自定义 DNS 服务器，如 "server=223.5.5.5"）。
# 当设置了 no-ipv6 时，Quantumult X 隧道的 DNS 模块将直接拦截并使得 AAAA (IPv6) 查询失败，但仍然允许向 IPv6 DNS 服务器发起 A 记录 (IPv4) 查询。
# DNS 查询结果仅用于判断本地分流规则，或在 direct (直连) 策略连接时使用。当通过 server (代理节点) 转发流量时，本地 DNS 结果不会被采用，且 Quantumult 将永远不会获知相关域名的最终目标 IP (由远端代理服务器解析)。
# 当设置了 prefer-doh3 时，DoH 查询将优先尝试通过 DNS over HTTP3 进行，如果失败，则查询连接会自动回退到 HTTP2。
# 由于 HTTP/2 和 HTTP/3 连接均支持多路复用，当你更改此 DNS 设置时，可能不会立即生效。你可以通过重新连接 Quantumult X Tunnel 主开关或手动切换设备的网络环境使其立刻生效。
# 当设置了 doh-server (DNS over HTTPS) 或 doq-server (DNS over QUIC) 时，系统 DNS 及其它未被特殊域名绑定的常规加密 DNS 服务器都将被忽略失效。
# DoQ 的默认端口是 853，如果你双方约定了使用如 456 之类的其他端口用于 DoQ，你可以将其设置为：quic://dns.example.com:456
# 多个 doq-server 或 doh-server 需要写在同一行（实现并发并发查询），不同的 URL 之间请使用逗号分隔。
# 当同时配置了 doq-server 和 doh-server 时，查询请求将被同时发送到所有配置的服务器（并发竞争）。
# 注意：若 iOS 系统版本 < iOS 13.0，doh-server 的最大数量被限制为 1。如果 iOS 系统版本 < iOS 15.0，最大数量被限制为 2。
# 特别注意：此处不允许直接将某个域名绑定解析到 127.0.0.1。
# 如果你想要将特定域名 (例如: example.com) 解析为 127.0.0.1，请在 "filter_local" (本地分流规则) 模块下添加 "host, example.com, reject"。
# 这里的 reject (拒绝) 动作会在该域名的 DNS 查询中直接返回包含 127.0.0.1 的响应。
#
# circumvent-ipv4-answer 和 circumvent-ipv6-answer 设置与上游 DNS 处理有关。
# 如果上游 DNS 返回的 A 或 AAAA 解析结果(IP)与这两个字段配置的内容相匹配，该解析结果将被 Quantumult 忽略并强制标记为查询失败。
# 如果同时向多个上游 DNS 发送查询，且最先返回的响应命中了这两个字段，Quantumult X 的 DNS 模块会继续等待其它上游服务器返回结果，直到有合法的 IP 为止。
# circumvent-ipv4-answer 和 circumvent-ipv6-answer 支持通配符 ? 和 *。
# 如果你正在使用带有去广告功能的上游 DNS 节点，请务必将 circumvent-ipv4-answer 和 circumvent-ipv6-answer 留空。
#
[dns]
# 屏蔽某些常被运营商劫持或被污染的无效解析 IP
;circumvent-ipv4-answer = 127.0.0.1, 0.0.0.0
;circumvent-ipv6-answer = ::
# 优先使用 HTTP3 进行 DoH 查询
;prefer-doh3
# 禁用系统自带 DNS
;no-system
# 屏蔽所有 IPv6 的 DNS 解析查询
no-ipv6
# 国内常规 DNS
server = 223.5.5.5
server = 119.29.29.29
# DoQ 服务器示例
;doq-server = quic://dns.adguard.com
# 并发 DoQ 配置示例
;doq-server = quic://dns1.example.com, quic://dns2.example.com
# 特定 SSID 环境下排除或包含特定的 DoQ/DoH
;doq-server = quic://dns.adguard.com, excluded_ssids=SSID1
;doq-server = quic://dns.adguard.com, included_ssids=SSID2
# DoH 服务器示例
;doh-server = https://dns.alidns.com/dns-query
;doh-server = https://exmaple1.com/dns-query, https://exmaple2.com/dns-query
;doh-server = https://223.6.6.6/dns-query, excluded_ssids=SSID1
;doh-server = https://223.5.5.5/dns-query, included_ssids=SSID2
# 指定端口常规 DNS 及 SSID 配置
;server = 8.8.8.8:53, excluded_ssids=SSID1
;server = 8.8.4.4:53, included_ssids=SSID2
# 针对特定域名使用特定 DNS 解析（域名 DNS 路由分流）
;server = /example0.com/system
;server = /example1.com/8.8.4.4
;server = /*.example2.com/223.5.5.5
;doh-server = /*.example3.com/https://doh.pub/dns-query, excluded_ssids=SSID2
;doq-server = /*.example4.com/quic://dns.adguard.com, excluded_ssids=SSID3
;server = /example4.com/[2001:4860:4860::8888]:53
# 强制将域名解析为指定静态 IP，类似本地 Hosts
;address = /example5.com/192.168.16.18
;address = /example6.com/[2001:8d3:8d3:8d3:8d3:8d3:8d3:8d3]
# 域名 CNAME 别名重定向
;alias = /example7.com/another-example.com

#
# static 策略 (静态策略) 会将流量指向你手动在候选节点列表中点选的服务器。
# available 策略 (可用性策略) 会基于 server_check_url 的测试结果，指向候选节点列表中第一个网络连通可用的节点（当该策略被触发，并且当前使用的策略结果不可用时，会立即启动针对该策略组中所有节点的并发 URL 延迟测试。如果当时没有任何网络请求使用该策略，意味着该策略处于空闲状态，即使对应的服务器实际上已经宕机，系统也不会主动发起测试。在这种空闲情况下，你可以通过手动启动测试来更新节点状态，但这实际上毫无意义）。
# round-robin 策略 (轮询策略) 会在每次发起新连接时，依次循环指向候选节点列表中的下一个服务器。
# dest-hash 策略 (目标哈希策略) 会使用目标地址（域名或 IP）作为哈希算法的输入参数，根据计算结果来决定指向哪个节点。此策略对于极度依赖会话持久性 (session persistence) 的特殊应用场景特别有用。请注意，在该策略组中增加或删除节点会改变已有的哈希对应关系结果。
# url-latency-benchmark 策略 (延迟基准测试策略) 会指向拥有最佳 url 连通性测试延迟结果的节点（系统在比较时会考虑配置的 tolerance 参数，即容差毫秒数）。当用户在 Quantumult X App 内部手动点击启动 url 测试时，该策略的指向结果也会随之更新。这种类型的策略支持 check-interval（检测间隔/秒）参数，如果该策略被任何网络请求激活使用，则计时器间隔将会生效。如果配置了 alive-checking=true，那么即使该策略处于空闲状态，系统也会后台根据指定间隔主动启动基准测试。
# ssid 策略 会根据当前设备的 Wi-Fi 或蜂窝网络环境自动指向所配置的对应节点或策略组。
# 参数 resource-tag-regex 和 server-tag-regex（支持正则表达式匹配标签）仅对 static、available 和 round-robin 这三种类型的策略有效。
#
[policy]
# 静态策略示例，附带图标
;static = policy-name-1, Sample-A, Sample-B, Sample-C, img-url=http://example.com/icon.png
# 可用性测试策略示例
;available = policy-name-2, Sample-A, Sample-B, Sample-C
# 轮询负载均衡策略示例
;round-robin = policy-name-3, Sample-A, Sample-B, Sample-C
# 根据网络 SSID 自动切换节点的策略示例
;ssid = policy-name-4, Sample-A, Sample-B, LINK_22E171:Sample-B, LINK_22E172:Sample-C
# 使用正则表达式动态筛选远程资源的静态策略组
;static = policy-name-5, resource-tag-regex=^sample, server-tag-regex=^example, img-url=http://example.com/icon.png
# 正则筛选可用策略组
;available = policy-name-6, resource-tag-regex=^sample, server-tag-regex=^example
# 正则筛选轮询策略组
;round-robin = policy-name-7, resource-tag-regex=^sample, server-tag-regex=^example
# 目标哈希保持策略组
;dest-hash = policy-name-8, resource-tag-regex=^sample, server-tag-regex=^example
# 自动选择最低延迟节点的策略组 (带容差 tolerance，以及存活检测 alive-checking)
;url-latency-benchmark = policy-name-9, resource-tag-regex=^sample, server-tag-regex=^example, check-interval=600, alive-checking=false, tolerance=0

#
# 参数 "tag" (标签名称) 和 "enabled" (启用状态) 是可选配置。
# 所有类型远程资源的默认自动同步间隔 (sync interval) 均为 86400 秒 (即 24 小时)。
# 你可以通过添加参数 update-interval=172800 来定制你期望的自动同步间隔（单位为秒）；设置负数值则代表彻底禁用该资源的自动同步。
# 如果配置了 require-devices，那么只有当目前运行此配置文件的 Quantumult 设备 ID 被包含在 require-devices 列表内时，这行配置才会被载入。
# Quantumult X 的设备 ID 可以在 App 内部的 "Settings - Misc Settings - About" (设置 - 其它设置 - 关于) 中查看到。
#
[server_remote]
# 远程订阅节点链接示例
;https://raw.githubusercontent.com/crossutility/Quantumult-X/master/server.snippet, tag=Sample-01
# 启用资源解析器 opt-parser
;https://raw.githubusercontent.com/crossutility/Quantumult-X/master/server.snippet, opt-parser=true, tag=Sample-01
# 禁用自动更新 update-interval=-1
;https://raw.githubusercontent.com/crossutility/Quantumult-X/master/server.snippet, update-interval=-1, tag=Sample-01
# 作为一个独立的静态策略组载入 as-policy=static
;https://raw.githubusercontent.com/crossutility/Quantumult-X/master/server-complete.snippet, tag=Sample-02, as-policy=static, img-url=http://example.com/icon.png, enabled=false
# 限制特定设备加载该订阅
;https://example.com/server.snippet, tag=Sample-03, img-url=http://example.com/icon.png, require-devices=ID1, ID2, enabled=false

#
# 参数 "tag", "force-policy" (强制指向策略) 和 "enabled" (启用状态) 是可选配置。
# 当你在配置中加入了 force-policy 参数后，远程资源订阅中本身自带的分流策略指向将被强制忽略，而是统一使用这里指定的 force-policy 策略。
#
[filter_remote]
# 获取远程分流规则并强制指派给直连 direct
FILTER_REGION, tag=CN, force-policy=direct, inserted-resource=true, enabled=true
FILTER_LAN, tag=LAN, force-policy=direct, inserted-resource=true, enabled=true
# 引用自定义分流规则集合
;https://raw.githubusercontent.com/crossutility/Quantumult-X/master/filter.snippet, tag=Sample, force-policy=your-policy-name, enabled=true
;https://example.com/filter.snippet, tag=Sample, force-policy=your-policy-name, require-devices=ID1, ID2, enabled=true

#
# 参数 "tag" 和 "enabled" 是可选配置。
#
[rewrite_remote]
# 引用远程重写 (Rewrite) 规则
;https://raw.githubusercontent.com/crossutility/Quantumult-X/master/sample-import-rewrite.snippet, tag=Sample, enabled=true
;https://example.com/rewrite.snippet, tag=Sample, require-devices=ID1, ID2, enabled=true

#
# 针对 Shadowsocks、VMess 等节点参数的详细说明：
# 仅 obfs=http, obfs=ws, obfs=wss 能够支持附加可选的 "obfs-uri" (混淆路径) 字段。
# 在 wss (WebSocket over TLS) 中填写的 obfs-host 参数将被同时用于 TLS 握手认证阶段以及 HTTP 标头中的 Host 字段；如果没有针对 wss 专门配置 obfs-host，则默认使用该节点的服务器地址。
# 当使用 obfs=ws 及 obfs=wss 时，对应的服务端可以通过部署配置了 mux = 0 的 v2ray-plugin、v2ray-core 本身或者是 trojan-go 来实现对接。
# 值得注意的一点是，使用 shadowsocksr python 版本服务端部署的节点天然自带默认支持 shadowsocks 的 udp-over-tcp (即 udp-over-tcp=true)；但如果是基于 Xray 的服务端等其他版本，则必须明确指定版本字符串如 "udp-over-tcp=sp.v1"；如果是基于支持版本 2 的服务端程序（例如 sing-box），则应当配置 "udp-over-tcp=sp.v2"。
# 如果你期望将 udp-relay 与 udp-over-tcp 结合在一起供 shadowsocks 使用，你必须确保你的服务端真正部署了 shadowsocksr python、Xray 或者其他支持此特性的程序。
# shadowsocksr python 原版服务端并不支持针对 "2022-blake3-aes-128-gcm" 以及 "2022-blake3-aes-256-gcm" 的 udp-over-tcp 处理。因此，若你倾向于使用 shadowsocks 2022 新版加密方式，请务必利用 Xray 或其它受支持的程序来部署 udp-over-tcp 环境，并在 Quantumult X 端配套设定 "udp-over-tcp=sp.v1" 或 "udp-over-tcp=sp.v2"。
# 需特别注意，obfs=tls 与 obfs=over-tls 是完全不同的两个概念。
# obfs=tls 指的是附属于 shadowsocks 项目的混淆插件 (obfs-plugin)，它实质上只是一种通过伪装出来的 TLS 协议混淆手段。
# 而 obfs=over-tls 则代表建立真实的 标准 TLS 协议隧道。Quantumult X 为 shadowsocks 同时提供了对这两种模式的全面支持。
# obfs 混淆插件中的 tls1.2_ticket_auth 会比 tls1.2_ticket_fastauth 甚至传统的 obfs tls 额外增加一个 RTT (往返时长) 的延迟损耗，强烈建议改用 tls1.2_ticket_fastauth。
# 加密算法 chacha20-ietf-poly1305 和 chacha20-poly1305 在 VMess 配置协议下具有相同的执行效果。
# 被用于执行 SSL 证书严格绑定 (SSL Pinning) 的 tls-cert-sha256 或 tls-pubkey-sha256，可以通过在终端使用 openssl 执行以下命令来计算生成：
# (计算 cert): openssl x509 -noout -fingerprint -sha256 -inform pem -in your-cert.pem
# (计算 pubkey): openssl x509 -inform pem -pubkey -noout < your-cert.pem | openssl pkey -pubin -outform der | openssl dgst -sha256
# 如果节点设置了 tls-verification = false (关闭证书校验)，那么配置的 tls-cert-sha256 和 tls-pubkey-sha256 参数将完全失效。
# 如果同时配置了 tls-pubkey-sha256，则系统会优先使用它，而忽略 tls-cert-sha256。
# 可选的 TLS 扩展参数 tls-alpn 接受的是 ALPN 扩展内容的十六进制 (hex) 格式，例如填写："02:68:32:08:68:74:74:70:2f:31:2e:31" 或者是 "02683208687474702f312e31"，它们代表的是 ALPN 协商内容为 "h2" (HTTP/2) 和 "http/1.1"。
# TLS 参数 tls-no-session-ticket 是可选的，仅为某些极其特殊的场景预留。
# 系统默认状态下是开启 session ticket 的 (tls-no-session-ticket=false)。如果你执意要禁用 session ticket 机制，请设定 tls-no-session-ticket=true。切记：只要服务端仍支持，新连接依然可能会基于之前缓存的 session ID 发生重用复用。
# TLS 参数 tls-no-session-reuse 是可选的，同样仅为特殊用途设计。
# 默认状态下系统允许 session reuse 会话复用 (tls-no-session-reuse=false)。将其设定为 true 将彻底禁用会话复用，并强制 Quantumult X 对每一条新连接发起完整的底层 TLS 握手流程。
# 当节点配置使用了标准 TLS，同时设置了特定的 tls-alpn=02683208687474702f312e31 (即声明支持 ALPN "h2" 和 "http/1.1") 且 tls-no-session-ticket=true (关闭 session ticket) 时，Quantumult X 将底层利用 iOS 18 Safari 指纹来进行这部分 TLS 握手（这是一种高级混淆指纹机制）；
# 否则，遇到常规配置情况，均会默认使用已开启 session ticket 特性的 iOS 18 Network Framework 系统底层指纹。
# 如果包含 over-tls 属性相关的节点配置 (比如 socks5: over-tls=true, trojan: over-tls=true 甚至 wss, vmess/vless: over-tls/wss 等) 额外声明了 "reality-base64-pubkey" 参数，那么标准的 TLS 机制将会立即被替换接管为 Reality 协议。
# 只要激活启用了 Reality，Quantumult X 底层将统一使用更新的 iOS 26 Safari 指纹 进行 Reality 握手交互，且原先自定义的 ALPN 和 session ticket 偏好配置均会被无视。
# 当采用 iOS 26 Safari 指纹发出网络请求时，由于融入了后量子密码学算法 X25519MLKEM768，Client Hello 数据包的体积会骤增超出 1500 字节，这将直接导致 TCP Fast Open 功能受阻无法成功。故而在配置 Reality TLS 时，千万不应该再启用 TCP Fast Open。
# 至于 tls13 强制开启参数，目前已被彻底弃用 (自 v1.0.26 版起)，现行版本始终自适应支持 TLS 1.3，无论你怎样设定。
# 属于 shadowsocks 协议的 obfs=http 是遵循 shadowsocks 项目中定义的 simple-obfs 官方插件规范的。而属于 VMess 协议的 obfs=http 则是严格遵循 V2Ray 核心的实现规范。
# 这两者的实现原理与细节可以说是风马牛不相及的。有时候为了刻意去适配你比较刁钻奇葩的服务端环境搭配（例如「使用 shadowsocks 的底层传输」+「搭配 VMess 的 http 混淆格式」，或者颠倒过来「使用 VMess」+「搭配 shadowsocks 的 simple-obfs 格式」），你能够强行给 shadowsocks 协议分配 obfs=vmess-http 属性，反之亦可为 vmess 协议分配 obfs=shadowsocks-http。
#
[server_local]
# 以下列举了极为丰富的本地节点格式示例，请参考格式书写：
# Shadowsocks 2022 系列及衍生：
;shadowsocks=example.com:80, method=2022-blake3-aes-128-gcm, password=BJDBGeLKx/JbEACCSN5rRg==, udp-relay=true, tag=ss2022-blake3-aes-128-gcm
;shadowsocks=example.com:80, method=2022-blake3-aes-256-gcm, password=RBUjIfGi9eThH+rkxXI0j1EdSGAZEf1jN9x1vn+Tf04=, udp-relay=true, tag=ss2022-blake3-aes-256-gcm
;shadowsocks=example.com:80, method=2022-blake3-aes-128-gcm, password=BJDBGeLKx/JbEACCSN5rRg==, obfs=http, obfs-host=apple.com, obfs-uri=/resource/file, udp-relay=true, tag=ss2022-obfs-http
;shadowsocks=example.com:443, method=2022-blake3-aes-128-gcm, password=BJDBGeLKx/JbEACCSN5rRg==, obfs=tls, obfs-host=apple.com, fast-open=false, udp-relay=true, tag=ss2022-obfs-tls
;shadowsocks=example.com:443, method=2022-blake3-aes-128-gcm, password=BJDBGeLKx/JbEACCSN5rRg==, obfs=over-tls, obfs-host=your.certificate.sni.name, tls-verification=true, udp-relay=true, tag=ss2022-tls-01
# SS 2022 搭配 udp-over-tcp (uot/uot2):
;shadowsocks=example.com:80, method=2022-blake3-aes-128-gcm, password=BJDBGeLKx/JbEACCSN5rRg==, udp-relay=true, udp-over-tcp=sp.v1, tag=ss2022-blake3-aes-128-gcm-uot
;shadowsocks=example.com:80, method=2022-blake3-aes-128-gcm, password=BJDBGeLKx/JbEACCSN5rRg==, udp-relay=true, udp-over-tcp=sp.v2, tag=ss2022-blake3-aes-128-gcm-uot2
;shadowsocks=example.com:443, method=2022-blake3-aes-128-gcm, password=BJDBGeLKx/JbEACCSN5rRg==, obfs=over-tls, obfs-host=your.certificate.sni.name, tls-verification=true, udp-relay=true, udp-over-tcp=sp.v1, tag=ss2022-blake3-aes-128-gcm-tls-uot
;shadowsocks=example.com:443, method=2022-blake3-aes-128-gcm, password=BJDBGeLKx/JbEACCSN5rRg==, obfs=over-tls, obfs-host=your.certificate.sni.name, tls-verification=true, udp-relay=true, udp-over-tcp=sp.v2, tag=ss2022-blake3-aes-128-gcm-tls-uot2
;shadowsocks=example.com:443, method=2022-blake3-aes-128-gcm, password=BJDBGeLKx/JbEACCSN5rRg==, obfs=over-tls, obfs-host=your.certificate.sni.name, tls-verification=true,tls-pubkey-sha256=eb5ec6684564fd0d04975903ed75342d1b9fdc2096ea54b4cf8caf4740f4ae25, udp-relay=true, udp-over-tcp=sp.v2, tag=ss2022-blake3-aes-128-gcm-tls-uot3
;shadowsocks=example.com:443, method=2022-blake3-aes-128-gcm, password=BJDBGeLKx/JbEACCSN5rRg==, obfs=over-tls, obfs-host=apple.com, reality-base64-pubkey=k4Uxez0sjl8bKaZH2Vgi8-WDFshML51QkxKFLWFIONk, reality-hex-shortid=0123456789abcdef, udp-relay=true, udp-over-tcp=sp.v2, tag=ss2022-blake3-aes-128-gcm-tls-reality-uot-01
# 传统 Shadowsocks 及插件组合：
;shadowsocks=example.com:80, method=chacha20, password=pwd, obfs=http, obfs-host=apple.com, obfs-uri=/resource/file, fast-open=false, udp-relay=false, server_check_url=http://www.apple.com/generate_204, tag=ss-obfs-http-01
;shadowsocks=example.com:80, method=chacha20, password=pwd, obfs=http, obfs-host=apple.com, obfs-uri=/resource/file, fast-open=false, udp-relay=false, tag=ss-obfs-http-02
;shadowsocks=example.com:443, method=chacha20, password=pwd, obfs=tls, obfs-host=apple.com, fast-open=false, udp-relay=false, tag=ss-obfs-tls-01
;shadowsocks=example.com:443, method=chacha20, password=pwd, obfs=over-tls, obfs-host=apple.com, tls-verification=true, tls-cert-sha256=b0088370d6c8e02d6e38c443abf81be2aaf1e18f00435aaf0b39852c338f7aaa, fast-open=false, udp-relay=false, tag=ss-tls-01
;shadowsocks=example.com:443, method=chacha20, password=pwd, obfs=over-tls, obfs-host=apple.com, tls-verification=true, tls-pubkey-sha256=eb5ec6684564fd0d04975903ed75342d1b9fdc2096ea54b4cf8caf4740f4ae25, fast-open=false, udp-relay=false, tag=ss-tls-02
;shadowsocks=example.com:443, method=chacha20, password=pwd, obfs=over-tls, obfs-host=apple.com, tls-verification=true, tls-pubkey-sha256=eb5ec6684564fd0d04975903ed75342d1b9fdc2096ea54b4cf8caf4740f4ae25, tls-alpn=02683208687474702f312e31, fast-open=false, udp-relay=false, tag=ss-tls-03
;shadowsocks=example.com:443, method=chacha20, password=pwd, ssr-protocol=auth_chain_b, ssr-protocol-param=def, obfs=tls1.2_ticket_fastauth, obfs-host=apple.com, tag=ssr
;shadowsocks=example.com:80, method=aes-128-gcm, password=pwd, obfs=ws, fast-open=false, udp-relay=false, tag=ss-ws-01
;shadowsocks=example.com:80, method=aes-128-gcm, password=pwd, obfs=ws, obfs-uri=/ws, fast-open=false, udp-relay=false, tag=ss-ws-02
;shadowsocks=example.com:443, method=aes-128-gcm, password=pwd, obfs=wss, obfs-uri=/ws, fast-open=false, udp-relay=false, tag=ss-ws-tls-01
;shadowsocks=example.com:443, method=aes-128-gcm, password=pwd, obfs=wss, obfs-uri=/ws, tls13=true, fast-open=false, udp-relay=false, tag=ss-ws-tls-02
;shadowsocks=example.com:80, method=chacha20, password=pwd, fast-open=false, udp-relay=true, udp-over-tcp=true, tag=ss-udp-over-tcp
#
# 对于 VMess 协议，如需彻底抛弃 aead 加密头，设定 aead=false 即可，系统预设值为 true。
# 请注意，如果你的服务端 (如老版本 V2Ray) 核心版本低于 v4.28，必须强制配置 aead=false 才能连接。
;vmess=example.com:80, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, fast-open=false, udp-relay=false, tag=vmess-01
;vmess=example.com:80, method=aes-128-gcm, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, fast-open=false, udp-relay=false, aead=false, tag=vmess-02
;vmess=example.com:443, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=over-tls, fast-open=false, udp-relay=false, tag=vmess-tls-01
;vmess=example.com:80, method=chacha20-poly1305, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=http, obfs-host=apple.com, obfs-uri=/resource/file, fast-open=false, udp-relay=false, server_check_url=http://www.apple.com/generate_204, tag=vmess-http
;vmess=192.168.1.1:443, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=over-tls, obfs-host=example.com, fast-open=false, udp-relay=false, tag=vmess-tls-02
;vmess=192.168.1.1:443, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=over-tls, obfs-host=example.com, tls13=true, fast-open=false, udp-relay=false, tag=vmess-tls-03
;vmess=192.168.1.1:443, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=over-tls, obfs-host=apple.com,  reality-base64-pubkey=k4Uxez0sjl8bKaZH2Vgi8-WDFshML51QkxKFLWFIONk, reality-hex-shortid=0123456789abcdef, udp-relay=true, tag=vmess-tls-reality-01
;vmess=example.com:80, method=chacha20-poly1305, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=ws, obfs-uri=/ws, fast-open=false, udp-relay=false, tag=vmess-ws-01
;vmess=192.168.1.1:80, method=chacha20-poly1305, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=ws, obfs-host=example.com, obfs-uri=/ws, fast-open=false, udp-relay=false, tag=vmess-ws-02
;vmess=example.com:443, method=chacha20-poly1305, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=wss, obfs-uri=/ws, fast-open=false, udp-relay=false, tag=vmess-ws-tls-01
;vmess=192.168.1.1:443, method=chacha20-poly1305, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=wss, obfs-host=example.com, obfs-uri=/ws, fast-open=false, udp-relay=false, tag=vmess-ws-tls-02
;vmess=192.168.1.1:443, method=chacha20-poly1305, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=wss, obfs-host=example.com, obfs-uri=/ws, tls13=true, fast-open=false, udp-relay=false, tag=vmess-ws-tls-03
;vmess=192.168.1.1:443, method=chacha20-poly1305, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=wss, obfs-host=apple.com, obfs-uri=/ws, reality-base64-pubkey=k4Uxez0sjl8bKaZH2Vgi8-WDFshML51QkxKFLWFIONk, reality-hex-shortid=0123456789abcdef, udp-relay=true, tag=vmess-wss-reality-01
#
# 对于 VLESS 协议，其 method (加密方式) 字段只能且必须填写 none。
;vless=example.com:80, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, fast-open=false, udp-relay=false, tag=vless-01
;vless=example.com:443, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=over-tls, fast-open=false, udp-relay=false, tag=vless-tls-01
;vless=example.com:80, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=http, obfs-host=apple.com, obfs-uri=/resource/file, fast-open=false, udp-relay=false, server_check_url=http://www.apple.com/generate_204, tag=vless-http
;vless=192.168.1.1:443, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=over-tls, obfs-host=example.com, fast-open=false, udp-relay=false, tag=vless-tls-02
;vless=192.168.1.1:443, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=over-tls, obfs-host=example.com, tls13=true, fast-open=false, udp-relay=false, tag=vless-tls-03
;vless=192.168.1.1:443, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=over-tls, obfs-host=apple.com, reality-base64-pubkey=k4Uxez0sjl8bKaZH2Vgi8-WDFshML51QkxKFLWFIONk, reality-hex-shortid=0123456789abcdef, udp-relay=true, tag=vless-tls-reality-01
;vless=192.168.1.1:80, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=ws, obfs-host=example.com, obfs-uri=/ws, fast-open=false, udp-relay=false, tag=vless-ws-02
;vless=example.com:443, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=wss, obfs-uri=/ws, fast-open=false, udp-relay=false, tag=vless-ws-tls-01
;vless=192.168.1.1:443, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=wss, obfs-host=example.com, obfs-uri=/ws, fast-open=false, udp-relay=false, tag=vless-ws-tls-02
;vless=192.168.1.1:443, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=wss, obfs-host=example.com, obfs-uri=/ws, tls13=true, fast-open=false, udp-relay=false, tag=vless-ws-tls-03
;vless=192.168.1.1:443, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=wss, obfs-host=apple.com, obfs-uri=/ws, reality-base64-pubkey=k4Uxez0sjl8bKaZH2Vgi8-WDFshML51QkxKFLWFIONk, reality-hex-shortid=0123456789abcdef, udp-relay=true, tag=vless-wss-reality-01
;vless=192.168.1.1:443, method=none, password=23ad6b10-8d1a-40f7-8ad0-e3e35cd32291, obfs=over-tls, obfs-host=apple.com, reality-base64-pubkey=k4Uxez0sjl8bKaZH2Vgi8-WDFshML51QkxKFLWFIONk, reality-hex-shortid=0123456789abcdef, vless-flow=xtls-rprx-vision, tag=vless-tls-reality-vision-01
#
# 对于 http(s) 代理协议，不接受且不支持配置 obfs 字段。
;http=example.com:80,fast-open=false, udp-relay=false, tag=http-01
;http=example.com:80, username=name, password=pwd, fast-open=false, udp-relay=false, tag=http-02
;http=example.com:443, username=name, password=pwd, over-tls=true, tls-host=example.com, tls-verification=true, fast-open=false, udp-relay=false, tag=http-tls-01
;http=example.com:443, username=name, password=pwd, over-tls=true, tls-host=example.com, tls-verification=true, tls-pubkey-sha256=eb5ec6684564fd0d04975903ed75342d1b9fdc2096ea54b4cf8caf4740f4ae25, fast-open=false, udp-relay=false, tag=http-tls-02
;http=example.com:443, username=name, password=pwd, over-tls=true, tls-host=example.com, tls-verification=true, tls-pubkey-sha256=eb5ec6684564fd0d04975903ed75342d1b9fdc2096ea54b4cf8caf4740f4ae25, tls-alpn=02683208687474702f312e31, fast-open=false, udp-relay=false, tag=http-tls-03
;http=example.com:443, username=name, password=pwd, over-tls=true, tls-host=apple.com, reality-base64-pubkey=k4Uxez0sjl8bKaZH2Vgi8-WDFshML51QkxKFLWFIONk, reality-hex-shortid=0123456789abcdef, udp-relay=false, tag=http-tls-reality-01
#
# Socks5 相关节点示例
;socks5=example.com:80,fast-open=false, udp-relay=false, tag=socks5-01
;socks5=example.com:80, username=name, password=pwd, fast-open=false, udp-relay=false, tag=socks5-02
;socks5=example.com:443, username=name, password=pwd, over-tls=true, tls-host=example.com, tls-verification=true, fast-open=false, udp-relay=false, tag=socks5-tls-01
;socks5=example.com:443, username=name, password=pwd, over-tls=true, tls-host=example.com, tls-verification=true, tls-pubkey-sha256=eb5ec6684564fd0d04975903ed75342d1b9fdc2096ea54b4cf8caf4740f4ae25, fast-open=false, udp-relay=false, tag=socks5-tls-02
;socks5=example.com:443, username=name, password=pwd, over-tls=true, tls-host=example.com, tls-verification=true, tls-pubkey-sha256=eb5ec6684564fd0d04975903ed75342d1b9fdc2096ea54b4cf8caf4740f4ae25, tls-alpn=02683208687474702f312e31, fast-open=false, udp-relay=false, tag=socks5-tls-03
;socks5=example.com:443, username=name, password=pwd, over-tls=true, tls-host=apple.com, reality-base64-pubkey=k4Uxez0sjl8bKaZH2Vgi8-WDFshML51QkxKFLWFIONk, reality-hex-shortid=0123456789abcdef, udp-relay=false, tag=socks5-tls-reality-01
#
# 对于 Trojan 协议，obfs 字段仅支持 WebSocket 也就是 wss 模式。
# 当启用 WebSocket (wss) 模式时，切记不要再填写 over-tls 以及 tls-host，而是必须改写成配套的 obfs=wss 以及 obfs-host 选项。
;trojan=example.com:443, password=pwd, over-tls=true, tls-verification=true, fast-open=false, udp-relay=false, tag=trojan-tls-01
;trojan=example.com:443, password=pwd, over-tls=true, tls-verification=true, tls13=true, fast-open=false, udp-relay=false, tag=trojan-tls-02
;trojan=192.168.1.1:443, password=pwd, over-tls=true, tls-host=example.com, tls-verification=true, fast-open=false, udp-relay=false, tag=trojan-tls-03
;trojan=192.168.1.1:443, password=pwd, over-tls=true, tls-host=example.com, tls-verification=true, tls13=true, fast-open=false, udp-relay=false, tag=trojan-tls-04
;trojan=192.168.1.1:443, password=pwd, over-tls=true, tls-host=example.com, tls-verification=true, tls-cert-sha256=b0088370d6c8e02d6e38c443abf81be2aaf1e18f00435aaf0b39852c338f7aaa, tls13=true, fast-open=false, udp-relay=false, tag=trojan-tls-05
;trojan=192.168.1.1:443, password=pwd, over-tls=true, tls-host=example.com, tls-verification=true, tls-pubkey-sha256=eb5ec6684564fd0d04975903ed75342d1b9fdc2096ea54b4cf8caf4740f4ae25, tls13=true, fast-open=false, udp-relay=false, tag=trojan-tls-06
;trojan=192.168.1.1:443, password=pwd, over-tls=true, tls-host=example.com, tls-verification=true, tls-pubkey-sha256=eb5ec6684564fd0d04975903ed75342d1b9fdc2096ea54b4cf8caf4740f4ae25, tls-alpn=02683208687474702f312e31, tls13=true, fast-open=false, udp-relay=false, tag=trojan-tls-07
;trojan=192.168.1.1:443, password=pwd, over-tls=true, tls-host=apple.com, reality-base64-pubkey=k4Uxez0sjl8bKaZH2Vgi8-WDFshML51QkxKFLWFIONk, reality-hex-shortid=0123456789abcdef, udp-relay=true, tag=trojan-tls-reality-01
;trojan=192.168.1.1:443, password=pwd, obfs=wss, obfs-host=example.com, obfs-uri=/path, udp-relay=true, tag=trojan-wss-05
;trojan=192.168.1.1:443, password=pwd, obfs=wss, obfs-host=apple.com, reality-base64-pubkey=k4Uxez0sjl8bKaZH2Vgi8-WDFshML51QkxKFLWFIONk, reality-hex-shortid=0123456789abcdef, obfs-uri=/path, udp-relay=true, tag=trojan-wss-reality-01
#
# 对于 anyTLS 协议节点而言，由于它天生基于 TCP 隧道原生传输 UDP 报文，无需在配置里单独为其声明 udp-over-tcp。
# 与其它协议类似，一旦追加了 reality-base64-pubkey，底层的标准 TLS 会被立即替换为 Reality TLS 环境。
;anytls=example.com:443, password=pwd, over-tls=true, tls-host=apple.com, udp-relay=true, tag=anytls-standard-tls-01
;anytls=example.com:443, password=pwd, over-tls=true, tls-host=apple.com, reality-base64-pubkey=k4Uxez0sjl8bKaZH2Vgi8-WDFshML51QkxKFLWFIONk, reality-hex-shortid=0123456789abcdef, udp-relay=true, tag=anytls-reality-tls-01

[filter_local]
# 本地分流规则部分：
;user-agent, ?abc*, proxy
;host, www.google.com, proxy
;host-keyword, adsite, reject
;host-wildcard, *.goo?le.com, proxy
;host-suffix, googleapis.com, proxy
;host-suffix, googleapis.com, proxy, force-cellular
;host-suffix, googleapis.com, proxy, multi-interface
;host-suffix, googleapis.com, proxy, multi-interface-balance
;host-suffix, googleapis.com, proxy, via-interface=pdp_ip0
;ip6-cidr, 2001:4860:4860::8888/32, direct
;ip-cidr, 10.0.0.0/8, direct
;ip-cidr, 127.0.0.0/8, direct
;ip-cidr, 172.16.0.0/12, direct
;ip-cidr, 192.168.0.0/16, direct
;ip-cidr, 224.0.0.0/24, direct
;geoip, cn, direct
;geoip, cn, direct, force-cellular
;ip-asn, 6185, proxy
#
# 你可以在下方添加一条 `host-keyword, ., proxy` 规则，这会使所有未匹配到域名的请求直接跳过本地 DNS 解析步骤。
# 纯 IP 发起的请求绝对不会被 host（主机名）相关的规则匹配到。
;host-keyword, ., proxy
# 最终的兜底规则：不满足上述任何条件的一律走 proxy 代理
final, proxy


#
# "reject" 重写会返回一个不带任何实质内容的 HTTP 404 状态码。这种类型的重写内置了一种特殊的防滥用机制，如果短时间内有大量高度重复的请求触发 reject，系统会给它施加 (0~5秒) 不等的动态延迟处理。重复请求越少，延迟就越短 (0)；反之恶意刷屏式重复越多，延迟就会越长 (直至封顶 5 秒)。
# "reject-200" 则会直接返回空内容的 HTTP 200 状态码。
# "reject-img" 拦截返回的是一张极小体积、仅 1x1 像素的 GIF 图片资源 (HTTP 200)。
# "reject-dict" 会拦截并伪造返回一个内容为空的 JSON 对象 `{}` (HTTP 200)。
# "reject-array" 会拦截并伪造返回一个空 JSON 数组 `[]` (HTTP 200)。
# "request-header" 可作用于所有的 HTTP 请求头部，不仅限于某单一行 Header，利用正则表达式你完全可以在一个匹配规则里覆盖带有 CRLF 回车换行的多个头。
# "jsonjq-response-body" 以及 "jsonjq-request-body" 支持使用 jsonjq 语法深度解析和提取重构 request body 请求体或 response body 响应体中的 JSON 数据块。
# "echo-response" 能将特定 URL 命中后的整个响应数据替换为你存放在本地文件系统中的静态文件，该替换主体文件必须被妥善保存在 "On My iPhone - Quantumult X - Data" 对应的文件夹目录下。
# 如果执行的 "rewrite" (重写) 动作涉及到修改 body，Quantumult 会在后台自发地帮你重算修改涉及长度 (Content-Length) 和编码形式相关的 HTTP Header，你完全不需要人工介入计算。
# 当然，如果原请求/响应本身完全就没有 body 内容（空内容），那么跟 body 相关的任何篡改规则都不会被执行。
# 当你编写 JavaScript 格式的重写脚本时，可以调用诸多底层对象：如 $request, $response, $notify(title, subtitle, message), console.log(message) 等等，所有被 Quantumult 官方内建的专属对象在命名上均会带有 "$" 前缀标识。
# 当前已支持解析的参数包括：$request.sessionIndex, $request.scheme, $request.method, $request.url, $request.path, $request.headers, $response.sessionIndex, $response.statusCode, $response.headers, $response.body 等。
# 如果某个 HTTP 响应确实属于刚才拦截修改过的请求，那么 $request.sessionIndex 必定与对应的 $response.sessionIndex 值相等。请注意，这里的 sessionIndex 跟主界面橘色 "Activity" (活动数据面板) 中显示的 TCP 记录索引毫无瓜葛。
# $notify(title, subtitle, message) API 将向 iOS 通知中心推送横幅，前提是必须先给 Quantumult X 授予定位通知的权限。
# $prefs 提供了本地持久化键值对存储的能力，其内置方法涵盖：$prefs.valueForKey(key), $prefs.setValueForKey(value, key), $prefs.removeValueForKey(key), 甚至 $prefs.removeAllValues() 删库跑路。
# console.log(message) 用于把日志字符串输出打印至 Quantumult 的专属 Log 文件内。
# setTimeout(function() { }, interval) 可以在 interval (毫秒) 延时后启动并执行指定的内置 function 回调函数。
# 无论是 script-request-header, script-request-body 还是其他基于 script-* 的高级重写脚本，都必须被放在本地设备文件夹 "On My iPhone - Quantumult X - Scripts" 中，或者放入 "iCloud Drive - Quantumult X - Scripts" 中。
# 这里汇集了海量的实战使用样例供您参考：https://github.com/crossutility/Quantumult-X
# script-analyze-echo-response 与常规 script-echo-response 最底层的不同之处在于：前者会耐心地等待将 HTTP request body (请求体) 彻底读取接收完，才会进入脚本逻辑执行。
#
# 对于配置为 url-and-header 类型的重写条目，不仅要求 URL 匹配，连带 Headers 匹配才会真正命中放行执行（内核会首先验证评估 URL，如果 URL 就不满足条件，直接抛弃不测后续 Headers）。用于比对的 Headers 字符串拼接结果内通常融合囊括了请求的 method (GET/POST等), 请求的 path, 以及完整的 key-value headers。
#
[rewrite_local]
# 本地重写规则示例：
;^http://example\.com/resource1/1/ url reject
;^http://example\.com/resource1/2/ url reject-img
;^http://example\.com/resource1/3/ url reject-200
;^http://example\.com/resource1/4/ url reject-dict
;^http://example\.com/resource1/5/ url reject-array
;^http://example\.com/resource2/ url 302 http://example.com/new-resource2/
;^http://example\.com/resource3/ url 307 http://example.com/new-resource3/
;^http://example\.com/resource4/ url jsonjq-response-body '.[0]'
;^http://example\.com/resource4/ url request-header ^GET /resource4/ HTTP/1\.1(\r\n) request-header GET /api/ HTTP/1.1$1
;^http://example\.com/resource4/ url request-header (\r\n)User-Agent:.+(\r\n) request-header $1User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36$2
;^http://example\.com/resource5/ url request-body "info":\[.+\],"others" request-body "info":[],"others"
;^http://example\.com/resource5/ url response-body "info":\[.+\],"others" response-body "info":[],"others"
;^http://example\.com/resource5/ url echo-response text/html echo-response index.html
;^http://example\.com/resource5/ url echo-response text/html\r\nHeader-1: value1\r\nHeader-2: value2 echo-response index.html
;^http://example\.com/resource6/ url script-response-body response-body.js
;^http://example\.com/resource7/ url script-echo-response script-echo.js
;^http://example\.com/resource8/ url script-response-header response-header.js
;^http://example\.com/resource9/ url script-request-header request-header.js
;^http://example\.com/resource10/ url script-request-body request-body.js
;^http://example\.com/resource1/1/ \r\nUser-Agent: example-agent url-and-header reject
;^http://example\.com/resource1/1/ ^POST url-and-header reject


#
# 如果配置声明了 require-devices，仅当目前运行该配置文件的设备 ID 列在 require-devices 名单内，下面的这行配置才会被执行并载入内存。
# （再强调一次，Quantumult 设备 ID 查询路径位于 App 内部："Settings - Misc Settings - About"）
# 定时任务通过核心 API $task.fetch() 来对外构建并发起纯粹的 HTTP 请求并处理远端返回的响应数据。需要注意目前仅能支持处理纯文本类的 response body 响应体。
# 你可以将一个 $task.fetch() 深度嵌入至另外一个 $task.fetch() 的回调 (completion handler) 闭包中，以此来达成串行不并行的逻辑链。
# 定时脚本必须放置在本地文件层目录 "On My iPhone - Quantumult X - Scripts" 或 iCloud 的 "iCloud Drive - Quantumult X - Scripts" 中。
# 标准的 Task API 脚本范例可以查看：https://github.com/crossutility/Quantumult-X/blob/master/sample-task.js
# 该网络请求的默认超时判定被设定为 10 秒钟。
#
# 定时任务的前置参数全面兼容 5 位或 6 位的标准 cron 表达式（这里不包含末尾带的命令行执行字段）。
# 另外提供了触发器模式：当底层捕获到网络环境大变更（如 Wi-Fi 与蜂窝数据切换）时，被挂载了 event-network 参数的脚本将被自发唤醒执行。
# 当用户主动去按压长按呼出相应的 UIAction 交互菜单时，配置了 event-interaction 属性的任务即会触发。
# 特别注意：这些事件监听 (event related task) 类型的任务，只能在确保 Quantumult X 核心隧道 (Tunnel) 完全启动并平稳运行的前提下才可能被唤醒。
#
[task_local]
# 定时脚本与触发器示例：
;* * * * * sample-task.js
;* * * * * sample-task2.js, img-url=https://raw.githubusercontent.com/crossutility/Quantumult-X/master/quantumult-x.png, tag=Sample, enabled=true
;* * * * * sample-task3.js, img-url=https://raw.githubusercontent.com/crossutility/Quantumult-X/master/quantumult-x.png, tag=Sample, require-devices=ID1, ID2, enabled=true
;event-network sample-task3.js
;event-interaction sample-task4.js
#
# 就同所有标准的网页浏览器工作原理一样，附着在 http(s) url 字符串后缀中 # (井号) 后面的内容无论如何都不会被主动打包送上远端服务器进行请求。
# 你完全可以通过在你的脚本 http(s) 链接末尾挂载 # 号来私自追加你所需要的某些定制化参数，随后在脚本当中调取内建 API `$environment.sourcePath` 来轻松获取原始完整的加载路径（比如形如 https://example.com/sample.js#this-is-not-sent-to-server&key1=value1&key2=value2 的完整字串），最后在脚本中利用正则去解剖并拆分提取这批定制参数供自己处理。
#
;* * * * * https://example.com/sample.js#this-is-not-sent-to-server&key1=value1&key2=value2, tag=Sample, enabled=true


#
# HTTP Backend 模块允许在 App 内部署一个迷你的本地 HTTP 托管服务器，并使用 JavaScript 进行数据拦截与中转运算处理。
# 如果声明了 require-devices，只有特定设备 ID 才允许装载该挂载。
# 脚本入参变量支持获取：$reqeust.url, $reqeust.path, $reqeust.headers, $reqeust.body。
# 数据运算完成后，需使用 $done() 函数来组装返回给请求端的响应结果，例：$done({status:"HTTP/1.1 200 OK"}, headers:{}, body:"这是一段伪造返回的字符串")。
# 更进阶的玩法，你可以借助数字签名或其他校验方案，借由此机制去筛查并严格鉴权过滤传入请求是否合理合法。
# 完成正确的映射部署后，你可以直接在设备浏览器内访问链接：http://127.0.0.1:9999/your-path/your-api/ 以观测执行效果。
#
[http_backend]
# HTTP 后端处理及接口映射示例：
;https://raw.githubusercontent.com/crossutility/Quantumult-X/master/sample-backend.js, tag=fileConverter, path=^/example/v1/
;preference.js, tag=userPreference, path=^/preference/v1/, img-url=https://example.com, enabled=true
;sample.js, tag=sample, path=^/sample/v1/, require-devices=ID1, ID2, enabled=true
;convert.js, tag=fileConverter, path=^/convert/v1/


#
# 如果一条 TCP 连接发起的源头 IP 刚好符合 skip_src_ip 数组中定下的规则，那么无论如何系统都将强行放行，彻底略过不再去评估它的原始主机名 (hostname)。支持使用 * 和 ? 这类通配符。
# 同样，若连接的目标最终 IP 命中了 skip_dst_ip 指定规则，该连接依然免去 hostname 的进一步核验校验。支持使用通配符 * 和 ?。
# 只有在配置文件中严格配置了需要接管 TLS SNI 的域名，或是 "hostname" 字段里特别指定的目标地址，才会遭到 MitM (中间人攻击) 引擎的接管解密处理。同样全面支持通配符 * 以及 ?。
#
# 极其重要！！！请无论如何都要保证你生成的 CA 证书密码短语 (passphrase) 以及 p12 证书文件的私密性，绝对不可泄露。
#
[mitm]
# p12 证书密码
;passphrase =
# p12 证书文件（通常会被 QX 自动转为 base64 填入）
;p12 =
# 是否跳过对服务器证书有效性的验证
;skip_validating_cert = false
# 跳过 MitM 解析的源 IP
;skip_src_ip = 192.168.1.5, 192.168.1.6
# 跳过 MitM 解析的目标 IP
;skip_dst_ip = 17.0.0.1
# 声明需要进行 MitM 解析的主机名（域名解析白名单）
;hostname = *.example.com, *.sample.com, non-existed-domain.com, *.non-connected-domain.com