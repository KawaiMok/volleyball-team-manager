# 推播種類一覽

伺服端以 [`src/lib/push/kinds.ts`](../src/lib/push/kinds.ts) 定義標題／內文；[`notify-events.ts`](../src/lib/push/notify-events.ts) 負責在 API 觸發。FCM `data` 內含 `type`、`teamId`、（多數）`eventId`，供日後 App 深連結。

| `data.type` | 觸發時機 | 接收對象 | 標題示例 |
|-------------|----------|----------|----------|
| `push_test` | `POST /api/me/push-test` | 目前登入者自己的裝置 | 排球隊管理 |
| `event_published` | 教練 **發布** 活動 | 全隊 ACTIVE 成員 | 新活動 |
| `event_updated` | 教練 **修改** 已發布活動 | 該活動參與者 | 活動資訊更新 |
| `event_announcement` | 教練／隊務發 **公告** | 活動參與者（不含發文者） | 公告：{活動名} |
| `event_comment` | 球員 **留言** | 教練端（教練／管理／隊務等） | 留言：{活動名} |
| `event_comment`（公告型） | 教練發公告時亦用 announcement 文案 | 同上 | 見 `event_announcement` |
| `rsvp_updated` | 球員 **RSVP** | 教練端（不含本人） | RSVP 更新 |

## 如何測試

1. **測試推播**：Safari 登入後 `POST /api/me/push-test`。
2. **新活動**：教練發布草稿活動。
3. **公告／留言**：在活動詳情留言區操作。
4. **RSVP**：球員帳號在活動內改出席意願。
5. **活動更新**：教練修改已發布活動的時間／標題等。

## 擴充新種類

1. 在 `PushKind` 與 `buildPushPayload` 增加 case。  
2. 在 `notify-events.ts` 新增 `notifyXxx` 並於對應 API 呼叫 `dispatchPush`／`notifyXxx`。  
3. 更新本表。
