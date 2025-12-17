// 生成或获取会话ID（使用 sessionStorage，仅在当前浏览器会话有效）
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  
  const key = 'huizi_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}
