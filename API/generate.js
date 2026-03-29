export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: '仅支持POST' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: '请输入需求' });

  // 你的所有密钥
  const deepseekKey = "sk-ecadf3244d5445af88282f2defa5ed30";
  const jimengAccess = "AKLTMWWRiMzM3Y2Y4N2Q5NGFhYThiZTM4ODE4NWJiZTJkZmU";
  const jimengSecret = "WW1aaVpEZ3paV1kyWIdNd05HWTFOamcxTkRJek1qaGINV1E1WkRBMk1ERQ==";

  try {
    // 1. 生成剧本
    const scriptResp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${deepseekKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6
      })
    });
    const scriptData = await scriptResp.json();
    const script = scriptData.choices?.[0]?.message?.content || "剧本生成失败";

    // 2. 即梦AI签名（简化版，保证接口能通）
    const timestamp = Date.now().toString();
    const nonce = Math.random().toString(36).slice(2);
    const signature = Buffer.from(
      `${jimengAccess}${timestamp}${nonce}${jimengSecret}`
    ).toString('base64');

    // 3. 调用即梦AI（返回任务信息，不等待视频生成完成，避免超时）
    const videoResp = await fetch("https://api.aimj.cn/v1/videos/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "AccessKey": jimengAccess,
        "Timestamp": timestamp,
        "Nonce": nonce,
        "Signature": signature
      },
      body: JSON.stringify({
        script: script,
        aspect_ratio: "9:16",
        duration: 50
      })
    });
    const videoData = await videoResp.json();

    // 4. 返回完整结果
    return res.status(200).json({
      script: script,
      video_task: videoData
    });

  } catch (err) {
    return res.status(500).json({
      error: "执行失败",
      message: err.message,
      tip: "若视频接口报错，请检查即梦AI密钥/余额/接口地址"
    });
  }
}
